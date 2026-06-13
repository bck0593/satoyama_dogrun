import { ReservationCancelDialog } from "@/src/components/reservation-cancel-dialog";
import { StatusPill } from "@/src/components/status-pill";
import { formatClockJa, formatDateTimeJa } from "@/src/lib/date-utils";
import {
  canCancelReservation,
  CANCELLATION_ROLE_LABEL,
  deriveUsageMinutes,
  formatReservationDate,
  PAYMENT_STATUS_LABEL,
  paymentStatusTone,
  RESERVATION_STATUS_LABEL,
  reservationStatusTone,
} from "@/src/lib/reservation-display";
import type { Reservation } from "@/src/lib/types";

export function ReservationHistoryCard({
  reservation,
  onCancel,
}: {
  reservation: Reservation;
  onCancel: (reservation: Reservation, reason: string) => Promise<void>;
}) {
  const usageMinutes = deriveUsageMinutes(
    reservation.checked_in_at,
    reservation.actual_checked_out_at,
    reservation.actual_duration_minutes,
  );
  const cancellationRoleLabel = reservation.cancelled_by_role
    ? CANCELLATION_ROLE_LABEL[reservation.cancelled_by_role] || reservation.cancelled_by_role
    : null;
  const cancelledByLabel =
    reservation.cancelled_by_role === "user"
      ? "本人"
      : reservation.cancelled_by_display_name || cancellationRoleLabel || "運営";

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={reservationStatusTone(reservation.status)}>
              {RESERVATION_STATUS_LABEL[reservation.status] || reservation.status}
            </StatusPill>
            <StatusPill tone={paymentStatusTone(reservation.payment_status)}>
              {PAYMENT_STATUS_LABEL[reservation.payment_status] || reservation.payment_status}
            </StatusPill>
          </div>
          <p className="mt-2 font-semibold text-gray-900">
            {formatReservationDate(reservation.date)} {reservation.start_time.slice(0, 5)} -{" "}
            {reservation.end_time.slice(0, 5)}
          </p>
        </div>
        {canCancelReservation(reservation) ? (
          <ReservationCancelDialog
            triggerLabel="予約をキャンセル"
            triggerClassName="shrink-0 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            title="この予約をキャンセルしますか"
            description="キャンセル後は元に戻せません。返金対象かどうかは予約時間と決済状況に応じて判定されます。"
            submitLabel="キャンセルする"
            reasonPlaceholder="体調不良、予定変更など"
            helperText="理由は任意です。"
            onSubmit={(reason) => onCancel(reservation, reason)}
          />
        ) : null}
      </div>

      {reservation.checked_in_at ? (
        <p className="mt-2 text-gray-600">
          実利用時間: {formatClockJa(reservation.checked_in_at)} -{" "}
          {reservation.actual_checked_out_at ? formatClockJa(reservation.actual_checked_out_at) : "利用中"}{" "}
          {usageMinutes !== null ? `(${usageMinutes}分)` : ""}
        </p>
      ) : (
        <p className="mt-2 text-gray-600">実利用時間: 未チェックイン</p>
      )}
      <p className="mt-1 text-gray-600">予約日時: {formatDateTimeJa(reservation.created_at, "未記録")}</p>
      <p className="text-gray-600">支払日時: {formatDateTimeJa(reservation.paid_at, "未記録")}</p>
      <p className="text-gray-600">
        利用犬:{" "}
        {reservation.reservation_dogs.length
          ? reservation.reservation_dogs.map((dog) => dog.dog_name).join(" / ")
          : "未登録"}
      </p>

      {reservation.cancelled_at ? (
        <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>キャンセル日時: {formatDateTimeJa(reservation.cancelled_at, "未記録")}</p>
          <p>キャンセル者: {cancelledByLabel}</p>
          {reservation.cancel_reason ? <p>理由: {reservation.cancel_reason}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
