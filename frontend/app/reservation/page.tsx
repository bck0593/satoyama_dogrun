"use client";

import { CalendarDays, CreditCard, Dog, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { AuthGuard } from "@/src/components/auth-guard";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { useDogs } from "@/src/hooks/use-dogs";
import { apiClient } from "@/src/lib/api";
import { toDateString } from "@/src/lib/date-utils";
import type { SlotAvailability } from "@/src/lib/types";

const FEE_PER_DOG = 1500;

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

export default function ReservationPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability | null>(null);
  const [selectedDogIds, setSelectedDogIds] = useState<number[]>([]);
  const [partySize, setPartySize] = useState(1);
  const [rainClosed, setRainClosed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { dogs, error: dogsError } = useDogs();
  const activeDogs = useMemo(() => dogs.filter((dog) => dog.is_active), [dogs]);
  const selectableDogs = useMemo(
    () => activeDogs.filter((dog) => dog.vaccine_approval_status === "approved"),
    [activeDogs],
  );

  const selectedDateText = useMemo(() => toDateString(selectedDate), [selectedDate]);
  const selectedDogCount = selectedDogIds.length;
  const amount = selectedDogCount * FEE_PER_DOG;
  const isSubmitDisabled = loading || rainClosed || !selectedSlot || !selectedDogIds.length;

  useEffect(() => {
    const availableIds = new Set(selectableDogs.map((dog) => dog.id));
    setSelectedDogIds((prev) => prev.filter((id) => availableIds.has(id)));
  }, [selectableDogs]);

  const loadAvailability = useCallback(async (dateText: string) => {
    try {
      const result = await apiClient.getAvailability(dateText);
      setSlots(result.slots);
      setRainClosed(Boolean(result.rain_closed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "空き状況の取得に失敗しました。");
    }
  }, []);

  useEffect(() => {
    setSelectedSlot(null);
    loadAvailability(selectedDateText).catch(() => null);
  }, [selectedDateText, loadAvailability]);

  const createReservationAndPay = useCallback(async () => {
    if (!selectedSlot || !selectedDogIds.length) {
      setError("日時と犬を選択してください。");
      return;
    }
    if (selectedSlot.available_total < selectedDogCount) {
      setError("選択頭数が空き枠を超えています。");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reservation = await apiClient.createReservation({
        date: selectedDateText,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
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
  }, [partySize, selectedDateText, selectedDogCount, selectedDogIds, selectedSlot]);

  const toggleDog = useCallback((dogId: number) => {
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
        <PageHeader title="予約" description="日付・時間・犬を選んで予約し、決済へ進みます" />

        <div className="space-y-4 px-4 py-5">
          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-bold text-gray-900">
              <CalendarDays className="mr-2 h-4 w-4 text-orange-500" />
              カレンダー
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
            <h2 className="mb-2 text-base font-bold text-gray-900">時間帯 / 空き状況</h2>
            {rainClosed ? (
              <p className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                雨天のため予約受付を停止しています。
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              {slots.map((slot) => {
                const active = selectedSlot?.start_time === slot.start_time;
                const full = slot.available_total <= 0;

                return (
                  <button
                    key={`${slot.start_time}-${slot.end_time}`}
                    type="button"
                    disabled={full}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm ${
                      active ? "border-orange-500 bg-orange-500 text-white" : "border-gray-200 bg-white text-gray-700"
                    } ${full ? "opacity-40" : ""}`}
                  >
                    <p className="font-semibold">
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </p>
                    <p className="text-xs">空き {slot.available_total} 頭</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-bold text-gray-900">
              <Dog className="mr-2 h-4 w-4 text-orange-500" />
              予約する犬
            </h2>
            <div className="space-y-2">
              {activeDogs.map((dog) => {
                const checked = selectedDogIds.includes(dog.id);
                const selectable = dog.vaccine_approval_status === "approved";
                const statusLabel =
                  dog.vaccine_approval_status === "approved"
                    ? "承認済み"
                    : dog.vaccine_approval_status === "rejected"
                      ? "差し戻し"
                      : "確認待ち";

                return (
                  <label
                    key={dog.id}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                      checked ? "border-orange-300 bg-orange-50" : "border-gray-200"
                    } ${!selectable ? "opacity-70" : ""}`}
                  >
                    <span>
                      {dog.name} ({dog.breed})
                      <span className="ml-2 text-xs text-gray-500">{statusLabel}</span>
                      {dog.vaccine_approval_status === "rejected" && dog.vaccine_review_note ? (
                        <span className="ml-2 text-xs text-red-600">{dog.vaccine_review_note}</span>
                      ) : null}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!selectable}
                      onChange={() => toggleDog(dog.id)}
                    />
                  </label>
                );
              })}

              {!dogs.length ? <p className="text-sm text-gray-500">先に犬登録を行ってください。</p> : null}
              {!!dogs.length && !activeDogs.length ? (
                <p className="text-sm text-amber-700">利用可能な犬がいません。マイページで犬情報をご確認ください。</p>
              ) : null}
              {!!activeDogs.length && !selectableDogs.length ? (
                <p className="text-sm text-amber-700">
                  ワクチン証明のスタッフ承認が完了した犬がいません。承認後に予約できます。
                </p>
              ) : null}
            </div>
          </section>

          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-bold text-gray-900">
              <Users className="mr-2 h-4 w-4 text-orange-500" />
              同伴人数
            </h2>
            <input
              type="number"
              min={1}
              value={partySize}
              onChange={(event) => handlePartySizeChange(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
          </section>

          <section className="section-card text-right">
            <h2 className="mb-2 flex items-center text-base font-bold text-gray-900">
              <CreditCard className="mr-2 h-4 w-4 text-emerald-600" />
              料金
            </h2>
            <p className="text-sm text-gray-700">1頭 1,500円 × {selectedDogCount} 頭</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{amount.toLocaleString()} 円</p>
            <p className="mt-1 text-xs text-gray-500">Stripeでオンライン決済します。</p>
          </section>

          {error || dogsError ? <p className="text-sm text-red-600">{error || dogsError}</p> : null}

          <button
            type="button"
            onClick={createReservationAndPay}
            disabled={isSubmitDisabled}
            className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "処理中..." : "予約して決済へ進む"}
          </button>
        </div>
      </MobilePage>
    </AuthGuard>
  );
}
