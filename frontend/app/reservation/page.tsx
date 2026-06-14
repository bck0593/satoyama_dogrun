"use client";

import Link from "next/link";
import { CalendarDays, CalendarX2, CheckCircle2, CreditCard, Dog, Info, Loader2, ShieldAlert, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { EmptyState } from "@/src/components/empty-state";
import { StatusPill } from "@/src/components/status-pill";
import { AuthGuard } from "@/src/components/auth-guard";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { SectionHeading } from "@/src/components/section-heading";
import { ListSkeleton, SlotGridSkeleton } from "@/src/components/skeletons";
import { useAuth } from "@/src/contexts/auth-context";
import { useDogs } from "@/src/hooks/use-dogs";
import { apiClient } from "@/src/lib/api";
import { toDateString } from "@/src/lib/date-utils";
import { sizeCategoryLabel } from "@/src/lib/dog-form";
import { isProfileComplete, isSuspended, summarizeDogs } from "@/src/lib/member-readiness";
import type { SlotAvailability } from "@/src/lib/types";

import {
  CALENDAR_CLASS_NAMES,
  dogStatusInfo,
  FEE_PER_DOG,
  getSlotCapacityIssue,
  hasValidVaccineForDate,
  slotTone,
} from "./_helpers";

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
  const [confirmOpen, setConfirmOpen] = useState(false);
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
  const partySizeIssue = selectedDogCount > 0 && partySize < selectedDogCount
    ? `来場人数（${partySize}人）は選択した犬の頭数（${selectedDogCount}頭）以上にしてください。`
    : null;
  const isSubmitDisabled =
    loading ||
    suspended ||
    rainClosed ||
    !selectedSlot ||
    !selectedDogIds.length ||
    !selectableDogs.length ||
    Boolean(slotCapacityIssue) ||
    Boolean(partySizeIssue);

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

  const handleConfirmBooking = async () => {
    // createReservationAndPay redirects on success; control only returns on failure.
    await createReservationAndPay();
    setConfirmOpen(false);
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
                      href="/dog-registration"
                      className="inline-flex rounded-xl bg-amber-500 px-3 py-2 font-bold text-white"
                    >
                      {dogs.length ? (expiredApprovedDogs.length ? "ワクチン期限を更新する" : "承認状況を見る") : "犬を登録する"}
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="section-card">
            <SectionHeading icon={CalendarDays} title="1. 日付を選ぶ" className="mb-3" />
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
            <SectionHeading
              title="2. 時間帯を選ぶ"
              action={
                <Link href="/live-status" className="text-sm font-bold text-[#0b438f] hover:underline">
                  いまの混雑を見る
                </Link>
              }
            />

            {rainClosed ? (
              <p className="mt-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                雨天のため予約受付を停止しています。
              </p>
            ) : null}

            {availabilityLoading ? <SlotGridSkeleton /> : null}

            {!availabilityLoading && !rainClosed && !slots.length ? (
              <EmptyState
                className="mt-3"
                icon={CalendarX2}
                title="この日の予約枠はまだありません"
                description="別の日付を選ぶか、最新の公開状況をご確認ください。"
              />
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
            <SectionHeading icon={Dog} title="3. 犬を選ぶ" className="mb-3" />
            {dogsLoading ? <ListSkeleton rows={2} /> : null}
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
                        <StatusPill tone="neutral">{sizeCategoryLabel(dog.size_category)}</StatusPill>
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

              {!dogsLoading && !dogs.length ? (
                <EmptyState
                  icon={Dog}
                  title="まだ犬が登録されていません"
                  description="ワクチン証明と一緒に登録し、スタッフ承認を受けると予約に使えます。"
                  action={
                    <Link
                      href="/dog-registration"
                      className="inline-flex rounded-xl bg-[#0a438d] px-4 py-2 text-sm font-bold text-white transition active:scale-[0.98]"
                    >
                      犬を登録する
                    </Link>
                  }
                />
              ) : null}
            </div>
          </section>

          <section className="section-card">
            <SectionHeading icon={Users} title="来場人数" className="mb-2" />
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
            <SectionHeading icon={CreditCard} title="予約内容の確認" />

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

            {partySizeIssue ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {partySizeIssue}
              </div>
            ) : null}
            {error || dogsError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                {error || dogsError}
              </div>
            ) : null}

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
                href="/dog-registration"
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white"
              >
                {expiredApprovedDogs.length ? "ワクチン期限を更新する" : "承認状況を確認する"}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={isSubmitDisabled}
                className="mt-4 w-full rounded-2xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-50"
              >
                予約内容を確認する
              </button>
            )}
          </section>
        </div>

        {confirmOpen ? (
          <div
            className="fixed inset-0 z-[60] overflow-y-auto bg-black/50"
            role="dialog"
            aria-modal="true"
            aria-label="予約内容の確認"
            onClick={() => {
              if (!loading) setConfirmOpen(false);
            }}
          >
            <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="w-full max-w-md rounded-3xl bg-white p-5 shadow-[0_18px_48px_rgba(8,38,83,0.32)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="heading-icon">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <h2 className="text-base font-black text-[#13386e]">この内容で予約しますか？</h2>
              </div>
              <p className="mt-2 text-sm text-[#557196]">「確定」を押すと決済画面に進みます。決済の完了で予約が確定します。</p>

              <dl className="mt-4 space-y-2 rounded-2xl border border-[#d7e2f2] bg-[#f8fbff] p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[#5b7397]">予約日</dt>
                  <dd className="font-bold text-[#15396e]">{selectedDateText}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#5b7397]">時間帯</dt>
                  <dd className="font-bold text-[#15396e]">
                    {selectedSlot ? `${selectedSlot.start_time.slice(0, 5)} - ${selectedSlot.end_time.slice(0, 5)}` : "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="shrink-0 text-[#5b7397]">利用犬</dt>
                  <dd className="text-right font-bold text-[#15396e]">
                    {selectedDogs.length ? selectedDogs.map((dog) => dog.name).join(" / ") : "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#5b7397]">来場人数</dt>
                  <dd className="font-bold text-[#15396e]">{partySize}人</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-[#dbe6f5] pt-2">
                  <dt className="text-[#5b7397]">お支払い</dt>
                  <dd className="text-lg font-black text-emerald-700">{amount.toLocaleString()}円</dd>
                </div>
              </dl>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 rounded-2xl border border-[#c9d8ec] bg-white px-4 py-3 text-sm font-bold text-[#11417f] transition active:scale-[0.99] disabled:opacity-50"
                >
                  戻る
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmBooking}
                  className="flex-1 rounded-2xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      処理中...
                    </span>
                  ) : (
                    "確定して決済へ"
                  )}
                </button>
              </div>
            </div>
            </div>
          </div>
        ) : null}
      </MobilePage>
    </AuthGuard>
  );
}
