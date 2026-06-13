import type { StatusTone } from "@/src/components/status-pill";
import type { PaymentHistoryItem, Reservation } from "@/src/lib/types";
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

export const PAYMENT_HISTORY_STATUS_LABEL: Record<PaymentHistoryItem["status"], string> = {
  created: "作成済み",
  paid: "決済済み",
  failed: "決済失敗",
  refunded: "返金済み",
};

export function reservationStatusTone(status: string): StatusTone {
  switch (status) {
    case "confirmed":
    case "checked_in":
      return "success";
    case "pending_payment":
      return "warning";
    case "cancelled":
    case "no_show":
      return "danger";
    default:
      return "neutral";
  }
}

export function paymentStatusTone(status: string): StatusTone {
  switch (status) {
    case "paid":
      return "success";
    case "unpaid":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

export function paymentHistoryStatusLabel(status: PaymentHistoryItem["status"]): string {
  return PAYMENT_HISTORY_STATUS_LABEL[status] ?? status;
}

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

/**
 * Actual usage minutes for a reservation. Prefers the server-provided value;
 * otherwise derives it from check-in / check-out timestamps. Returns null when unknown.
 */
export function deriveUsageMinutes(
  startAt: string | null,
  endAt: string | null | undefined,
  fallbackMinutes?: number | null,
): number | null {
  if (typeof fallbackMinutes === "number") return fallbackMinutes;
  if (!startAt || !endAt) return null;
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.max(Math.floor((end.getTime() - start.getTime()) / 60000), 0);
}
