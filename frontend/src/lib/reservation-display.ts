import type { Reservation } from "@/src/lib/types";
import { toTokyoDateTimeValue } from "@/src/lib/date-utils";

export const ACTIVE_RESERVATION_STATUSES = new Set(["pending_payment", "confirmed", "checked_in"]);
export const CANCELLABLE_RESERVATION_STATUSES = new Set(["pending_payment", "confirmed"]);

export const RESERVATION_STATUS_LABEL: Record<string, string> = {
  pending_payment: "決済待ち",
  confirmed: "予約確定",
  checked_in: "利用中",
  completed: "利用完了",
  cancelled: "キャンセル",
  no_show: "無断キャンセル",
  expired: "期限切れ",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "未決済",
  paid: "決済済み",
  refunded: "返金済み",
  failed: "決済失敗",
};

export const CANCELLATION_ROLE_LABEL: Record<string, string> = {
  user: "本人",
  admin: "運営",
};

export function toDateTimeValue(date: string, time: string) {
  return toTokyoDateTimeValue(date, time);
}

export function getReservationEndValue(reservation: Pick<Reservation, "date" | "start_time" | "end_time">) {
  const endValue = toDateTimeValue(reservation.date, reservation.end_time);
  if (Number.isFinite(endValue)) return endValue;
  return toDateTimeValue(reservation.date, reservation.start_time);
}

export function formatReservationDate(date: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00+09:00`));
}

export function getUpcomingReservation(reservations: Reservation[], now = Date.now()): Reservation | null {
  const list = reservations
    .filter((item) => ACTIVE_RESERVATION_STATUSES.has(item.status))
    .filter((item) => getReservationEndValue(item) >= now)
    .sort((a, b) => toDateTimeValue(a.date, a.start_time) - toDateTimeValue(b.date, b.start_time));
  return list[0] ?? null;
}

export function canCancelReservation(reservation: Pick<Reservation, "status">) {
  return CANCELLABLE_RESERVATION_STATUSES.has(reservation.status);
}
