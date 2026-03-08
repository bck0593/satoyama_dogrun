"use client";

import Link from "next/link";
import { CalendarDays, CheckCircle2, CreditCard, Dog, Info, ShieldAlert, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { StatusPill } from "@/src/components/status-pill";
import { AuthGuard } from "@/src/components/auth-guard";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { useAuth } from "@/src/contexts/auth-context";
import { useDogs } from "@/src/hooks/use-dogs";
import { apiClient } from "@/src/lib/api";
import { toDateString } from "@/src/lib/date-utils";
import { isProfileComplete, isSuspended, summarizeDogs } from "@/src/lib/member-readiness";
import type { Dog as DogProfile, SlotAvailability } from "@/src/lib/types";

const FEE_PER_DOG = 200;

const CALENDAR_CLASS_NAMES = {
  month_caption: "flex h-10 items-center justify-center px-10",
  caption_label: "text-base font-bold text-[#0e3875]",
  nav: "absolute inset-x-0 top-1 flex w-full items-center justify-between",
  button_previous:
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#c5d4e9] bg-white text-[#0f3b79] hover:bg-[#edf3fb]",
  button_next:
    "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#c5d4e9] bg-white text-[#0f3b79] hover:bg-[#edf3fb]",
  weekdays: "mt-2",
  weekday: "text-xs font-semibold text-[#4c6a97]",
  week: "mt-1",
  day: "text-sm font-medium text-[#123b73] [&[data-selected=true]_button]:rounded-full [&[data-selected=true]_button]:bg-[#001f54] [&[data-selected=true]_button]:text-white",
  day_button: "h-9 w-9 rounded-full",
  selected: "bg-transparent text-inherit",
  today: "border border-[#7ca0d4] text-[#0a3f87]",
  outside: "text-[#9cb0cc]",
  disabled: "text-[#c7d2e3]",
};

function slotTone(slot: SlotAvailability) {
  if (slot.available_total <= 0) {
    return {
      label: "満員",
      tone: "danger" as const,
      className: "border-slate-200 bg-slate-100 text-slate-400",
    };
  }
  if (slot.available_total <= 3) {
    return {
      label: "残りわずか",
      tone: "warning" as const,
      className: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }
  return {
    label: "空きあり",
    tone: "success" as const,
    className: "border-[#cbd8ea] bg-white text-[#163865]",
  };
}

function dogStatusInfo(status: "pending" | "approved" | "rejected") {
  if (status === "approved") {
    return { label: "承認済み", tone: "success" as const, detail: "この犬で予約できます。" };
  }
  if (status === "rejected") {
    return { label: "差し戻し", tone: "danger" as const, detail: "証明書の再提出後に予約できます。" };
  }
  return { label: "確認待ち", tone: "warning" as const, detail: "スタッフ承認後に予約できます。" };
}

function sizeLabel(sizeCategory: "small" | "medium" | "large") {
  if (sizeCategory === "small") return "小型犬";
  if (sizeCategory === "medium") return "中型犬";
  return "大型犬";
}

function hasValidVaccineForDate(dog: Pick<DogProfile, "vaccine_expires_on">, selectedDateText: string) {
  return dog.vaccine_expires_on >= selectedDateText;
}

function getSlotCapacityIssue(slot: SlotAvailability, dogs: DogProfile[]) {
  if (slot.available_total < dogs.length) {
    return "選択頭数が空き枠を超えています。";
  }

  const selectedLargeDogs = dogs.filter((dog) => dog.size_category === "large").length;
  const selectedSmallDogs = dogs.filter((dog) => dog.size_category === "small").length;
  const availableLargeDogs = Math.max(slot.max_large_dogs - slot.reserved_large, 0);
  const availableSmallDogs =
    typeof slot.available_small === "number"
      ? slot.available_small
      : typeof slot.max_small_dogs === "number" && typeof slot.reserved_small === "number"
        ? Math.max(slot.max_small_dogs - slot.reserved_small, 0)
        : Number.POSITIVE_INFINITY;

  if (selectedLargeDogs > availableLargeDogs) {
    return "大型犬の受入上限を超えるため、この時間は予約できません。";
  }

  if (selectedSmallDogs > availableSmallDogs) {
    return "小型犬の受入上限を超えるため、この時間は予約できません。";
  }

  return null;
}

export default function ReservationPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability | null>(null);
  const [selectedDogIds, setSelectedDogIds] = useState<number[]>([]);
  const [partySize, setPartySize] = useState(1);
  const [rainClosed, setRainClosed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { dogs, loading: dogsLoading, error: dogsError } = useDogs();
  const profileReady = isProfileComplete(user);
  const suspended = isSuspended(user);
  const dogSummary = useMemo(() => summarizeDogs(dogs), [dogs]);
  const activeDogs = dogSummary.activeDogs;
  const selectedDateText = useMemo(() => toDateString(selectedDate), [selectedDate]);
  const expiredApprovedDogs = useMemo(
    () => dogSummary.approvedDogs.filter((dog) => !hasValidVaccineForDate(dog, selectedDateText)),
    [dogSummary.approvedDogs, selectedDateText],
  );
  const selectableDogs = useMemo(
    () => dogSummary.approvedDogs.filter((dog) => hasValidVaccineForDate(dog, selectedDateText)),
    [dogSummary.approvedDogs, selectedDateText],
  );
  const selectedDogCount = selectedDogIds.length;
  const selectedDogs = useMemo(
    () => activeDogs.filter((dog) => selectedDogIds.includes(dog.id)),
    [activeDogs, selectedDogIds],
  );
  const slotCapacityIssue = useMemo(
    () => (selectedSlot ? getSlotCapacityIssue(selectedSlot, selectedDogs) : null),
    [selectedDogs, selectedSlot],
  );
  const amount = selectedDogCount * FEE_PER_DOG;
  const isSubmitDisabled =
    loading ||
    suspended ||
    rainClosed ||
    !selectedSlot ||
    !selectedDogIds.length ||
    !selectableDogs.length ||
    Boolean(slotCapacityIssue);

  useEffect(() => {
    const availableIds = new Set(selectableDogs.map((dog) => dog.id));
    setSelectedDogIds((prev) => prev.filter((id) => availableIds.has(id)));
  }, [selectableDogs]);

  const loadAvailability = useCallback(async (dateText: string) => {
    setAvailabilityLoading(true);
    try {
      const result = await apiClient.getAvailability(dateText);
      setSlots(result.slots);
      setRainClosed(Boolean(result.rain_closed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "空き状況の取得に失敗しました。");
      setSlots([]);
      setRainClosed(false);
    } finally {
      setAvailabilityLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedSlot(null);
    setError(null);
    loadAvailability(selectedDateText).catch(() => null);
  }, [selectedDateText, loadAvailability]);

  const createReservationAndPay = useCallback(async () => {
    if (!selectedSlot || !selectedDogIds.length) {
      setError("日時と犬を選択してください。");
      return;
    }
    if (selectedDogs.some((dog) => !hasValidVaccineForDate(dog, selectedDateText))) {
      const expiredDog = selectedDogs.find((dog) => !hasValidVaccineForDate(dog, selectedDateText));
      setError(
        expiredDog
          ? `${expiredDog.name} のワクチン期限が予約日まで有効ではありません。`
          : "ワクチン期限をご確認ください。",
      );
      return;
    }
    if (slotCapacityIssue) {
      setError(slotCapacityIssue);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reservation = await apiClient.createReservation({
        date: selectedDateText,
        start_time: selectedSlot.start_time,
        party_size: partySize,
        dog_ids: selectedDogIds,
      });

      const checkout = await apiClient.createCheckoutSession({
        reservation_id: reservation.id,
        success_url: `${window.location.origin}/mypage`,
        cancel_url: `${window.location.origin}/reservation`,
      });

      window.location.href = checkout.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "予約または決済に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [partySize, selectedDateText, selectedDogIds, selectedDogs, selectedSlot, slotCapacityIssue]);

  const toggleDog = useCallback((dogId: number) => {
    setError(null);
    setSelectedDogIds((prev) => (prev.includes(dogId) ? prev.filter((id) => id !== dogId) : [...prev, dogId]));
  }, []);

  const handlePartySizeChange = (value: string) => {
    const next = Number(value);
    if (!Number.isFinite(next)) {
      setPartySize(1);
      return;
    }
    setPartySize(Math.max(1, Math.floor(next)));
  };

  return (
    <AuthGuard>
      <MobilePage>
        <PageHeader title="予約" description="空き状況を見て、そのまま事前決済まで進めます" />

        <div className="space-y-4 px-4 py-5">
          {suspended ? (
            <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-bold">利用停止期間中のため、現在は予約できません。</p>
                  <p className="mt-1">マイページで停止期間を確認してください。</p>
                  <Link href="/mypage" className="mt-3 inline-flex font-bold text-red-900">
                    マイページで確認する
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          {!profileReady && !suspended ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-bold">連絡先を入れておくと、当日の連絡や確認がスムーズです。</p>
                  <Link href="/mypage" className="mt-3 inline-flex font-bold text-amber-900">
                    プロフィールを確認する
                  </Link>
                </div>
              </div>
            </section>
          ) : null}

          {!selectableDogs.length && !suspended ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <Dog className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-bold">予約に使える犬がまだいません。</p>
                  <p className="mt-1">
                    {dogs.length
                      ? expiredApprovedDogs.length
                        ? "予約日まで有効なワクチン証明の犬がいません。期限を更新してください。"
                        : "ワクチン証明が承認されると予約できます。"
                      : "まずは犬登録を行ってください。"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={dogs.length ? "/mypage" : "/dog-registration"}
                      className="inline-flex rounded-xl bg-amber-500 px-3 py-2 font-bold text-white"
                    >
                      {dogs.length ? (expiredApprovedDogs.length ? "犬情報を確認する" : "承認状況を見る") : "犬を登録する"}
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-black text-gray-900">
              <CalendarDays className="mr-2 h-4 w-4 text-[#0a438d]" />
              1. 日付を選ぶ
            </h2>
            <div className="rounded-xl border border-[#cbd8ea] bg-[#f8fbff] p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={{ before: new Date() }}
                showOutsideDays
                className="mx-auto w-fit text-[#0f3166]"
                classNames={CALENDAR_CLASS_NAMES}
              />
            </div>
            <p className="mt-2 text-sm text-gray-600">選択日: {selectedDateText}</p>
          </section>

          <section className="section-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-gray-900">2. 時間帯を選ぶ</h2>
              <Link href="/live-status" className="text-sm font-bold text-[#0b438f]">
                いまの混雑を見る
              </Link>
            </div>

            {rainClosed ? (
              <p className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                雨天のため予約受付を停止しています。
              </p>
            ) : null}

            {availabilityLoading ? <p className="mt-3 text-sm text-gray-500">空き状況を確認しています...</p> : null}

            {!availabilityLoading && !rainClosed && !slots.length ? (
              <p className="mt-3 text-sm text-gray-500">この日の予約枠はまだ公開されていません。</p>
            ) : null}

            <div className="mt-3 grid grid-cols-2 gap-2">
              {slots.map((slot) => {
                const active = selectedSlot?.start_time === slot.start_time;
                const meta = slotTone(slot);

                return (
                  <button
                    key={`${slot.start_time}-${slot.end_time}`}
                    type="button"
                    disabled={slot.available_total <= 0}
                    onClick={() => {
                      setError(null);
                      setSelectedSlot(slot);
                    }}
                    className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
                      active
                        ? "border-[#0a438d] bg-[#0a438d] text-white shadow-[0_8px_18px_rgba(10,67,141,0.22)]"
                        : meta.className
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </p>
                      {!active ? <StatusPill tone={meta.tone}>{meta.label}</StatusPill> : <StatusPill tone="neutral">選択中</StatusPill>}
                    </div>
                    <p className={`mt-2 text-xs ${active ? "text-white/85" : "text-inherit"}`}>
                      空き {slot.available_total} 頭 / 最大 {slot.max_total_dogs} 頭
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedSlot && slotCapacityIssue ? (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {slotCapacityIssue}
              </p>
            ) : null}
          </section>

          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-black text-gray-900">
              <Dog className="mr-2 h-4 w-4 text-[#0a438d]" />
              3. 犬を選ぶ
            </h2>
            {dogsLoading ? <p className="text-sm text-gray-500">犬情報を読み込んでいます...</p> : null}
            <div className="space-y-2">
              {activeDogs.map((dog) => {
                const checked = selectedDogIds.includes(dog.id);
                const vaccineExpired = !hasValidVaccineForDate(dog, selectedDateText);
                const selectable = dog.vaccine_approval_status === "approved" && !vaccineExpired;
                const status = vaccineExpired
                  ? {
                      label: "期限切れ",
                      tone: "danger" as const,
                      detail: "予約日までにワクチン期限が切れるため選択できません。",
                    }
                  : dogStatusInfo(dog.vaccine_approval_status);

                return (
                  <label
                    key={dog.id}
                    className={`flex items-start justify-between gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
                      checked ? "border-[#0a438d] bg-[#eff5ff]" : "border-gray-200 bg-white"
                    } ${!selectable ? "opacity-80" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-gray-900">{dog.name}</p>
                        <StatusPill tone="neutral">{sizeLabel(dog.size_category)}</StatusPill>
                        <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      </div>
                      <p className="mt-1 text-gray-600">{dog.breed}</p>
                      <p className="mt-1 text-xs text-gray-500">{status.detail}</p>
                      {dog.vaccine_approval_status === "rejected" && dog.vaccine_review_note ? (
                        <p className="mt-1 text-xs text-red-600">{dog.vaccine_review_note}</p>
                      ) : null}
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!selectable}
                      onChange={() => toggleDog(dog.id)}
                      className="mt-1 h-4 w-4 shrink-0"
                    />
                  </label>
                );
              })}

              {!dogs.length ? <p className="text-sm text-gray-500">先に犬登録を行ってください。</p> : null}
            </div>
          </section>

          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-black text-gray-900">
              <Users className="mr-2 h-4 w-4 text-[#0a438d]" />
              来場人数
            </h2>
            <p className="mb-2 text-sm text-gray-600">飼い主と同伴者を含めた人数です。</p>
            <input
              type="number"
              min={1}
              value={partySize}
              onChange={(event) => handlePartySizeChange(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
          </section>

          <section className="brand-card p-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-black text-gray-900">予約内容の確認</h2>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-[#d7e2f2] bg-[#f8fbff] px-4 py-3">
                <p className="text-xs font-semibold text-[#5b7397]">予約日</p>
                <p className="mt-1 text-base font-black text-[#15396e]">{selectedDateText}</p>
              </div>

              <div className="rounded-2xl border border-[#d7e2f2] bg-[#f8fbff] px-4 py-3">
                <p className="text-xs font-semibold text-[#5b7397]">時間帯</p>
                <p className="mt-1 text-base font-black text-[#15396e]">
                  {selectedSlot
                    ? `${selectedSlot.start_time.slice(0, 5)} - ${selectedSlot.end_time.slice(0, 5)}`
                    : "まだ選択していません"}
                </p>
              </div>

              <div className="rounded-2xl border border-[#d7e2f2] bg-[#f8fbff] px-4 py-3">
                <p className="text-xs font-semibold text-[#5b7397]">利用犬</p>
                <p className="mt-1 text-base font-black text-[#15396e]">
                  {selectedDogs.length ? selectedDogs.map((dog) => dog.name).join(" / ") : "まだ選択していません"}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-sm text-emerald-800">1頭 200円 × {selectedDogCount} 頭</p>
                <p className="mt-1 text-2xl font-black text-emerald-900">{amount.toLocaleString()} 円</p>
                <p className="mt-1 text-xs text-emerald-700">オンライン決済後に予約が確定します。</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#d7e2f2] bg-white px-4 py-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0a438d]" />
                <div className="text-sm text-[#516c92]">
                  <p className="font-bold text-[#143a71]">予約前に確認しておきたいこと</p>
                  <ul className="mt-2 space-y-1">
                    <li>ワクチン証明が承認済みの犬のみ予約できます。</li>
                    <li>時間帯ごとの頭数上限を超えると予約できません。</li>
                    <li>当日は現地でQRチェックインを行います。</li>
                  </ul>
                </div>
              </div>
            </div>

            {error || dogsError ? <p className="mt-4 text-sm text-red-600">{error || dogsError}</p> : null}

            {suspended ? (
              <Link
                href="/mypage"
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
              >
                利用停止状況をマイページで確認
              </Link>
            ) : !dogs.length ? (
              <Link
                href="/dog-registration"
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white"
              >
                犬を登録する
              </Link>
            ) : !selectableDogs.length ? (
              <Link
                href="/mypage"
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white"
              >
                {expiredApprovedDogs.length ? "犬情報を確認する" : "承認状況を確認する"}
              </Link>
            ) : (
              <button
                type="button"
                onClick={createReservationAndPay}
                disabled={isSubmitDisabled}
                className="mt-4 w-full rounded-2xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {loading ? "処理中..." : "予約して決済へ進む"}
              </button>
            )}
          </section>
        </div>
      </MobilePage>
    </AuthGuard>
  );
}
