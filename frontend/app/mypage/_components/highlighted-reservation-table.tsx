import { ReservationCancelDialog } from "@/src/components/reservation-cancel-dialog";
import { StatusPill } from "@/src/components/status-pill";
import { formatClockJa, formatDateTimeJa } from "@/src/lib/date-utils";
import {
  canCancelReservation,
  deriveUsageMinutes,
  formatReservationDate,
  PAYMENT_STATUS_LABEL,
  paymentStatusTone,
  RESERVATION_STATUS_LABEL,
  reservationStatusTone,
} from "@/src/lib/reservation-display";
import type { Reservation } from "@/src/lib/types";

export function HighlightedReservationTable({
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

  return (
    <div className="rounded-2xl border border-[#cad8eb] bg-[#f8fbff] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#15396e]">表示中の予約・履歴</p>
          <p className="mt-1 text-sm text-[#587196]">1件だけ先頭に表示しています。</p>
        </div>
        {canCancelReservation(reservation) ? (
          <ReservationCancelDialog
            triggerLabel="予約をキャンセル"
            triggerClassName="shrink-0 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            title="この予約をキャンセルしますか"
            description="キャンセル後は元に戻せません。返金対象かどうかは予約時間と決済状況に応じて判定されます。"
            submitLabel="キャンセルする"
            reasonPlaceholder="理由があれば入力"
            helperText="任意入力です。"
            onSubmit={(reason) => onCancel(reservation, reason)}
          />
        ) : null}
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-white bg-white">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-100">
              <th className="w-24 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">日時</th>
              <td className="px-3 py-2 font-semibold text-slate-900">
                {formatReservationDate(reservation.date)} {reservation.start_time.slice(0, 5)} -{" "}
                {reservation.end_time.slice(0, 5)}
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">状態</th>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={reservationStatusTone(reservation.status)}>
                    {RESERVATION_STATUS_LABEL[reservation.status] || reservation.status}
                  </StatusPill>
                  <StatusPill tone={paymentStatusTone(reservation.payment_status)}>
                    {PAYMENT_STATUS_LABEL[reservation.payment_status] || reservation.payment_status}
                  </StatusPill>
                </div>
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">利用犬</th>
              <td className="px-3 py-2 text-slate-700">
                {reservation.reservation_dogs.length
                  ? reservation.reservation_dogs.map((dog) => dog.dog_name).join(" / ")
                  : "未登録"}
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">予約日時</th>
              <td className="px-3 py-2 text-slate-700">{formatDateTimeJa(reservation.created_at, "未記録")}</td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">支払日時</th>
              <td className="px-3 py-2 text-slate-700">{formatDateTimeJa(reservation.paid_at, "未記録")}</td>
            </tr>
            <tr>
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">実利用時間</th>
              <td className="px-3 py-2 text-slate-700">
                {reservation.checked_in_at
                  ? `${formatClockJa(reservation.checked_in_at)} - ${
                      reservation.actual_checked_out_at ? formatClockJa(reservation.actual_checked_out_at) : "利用中"
                    }${usageMinutes !== null ? ` (${usageMinutes}分)` : ""}`
                  : "未チェックイン"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
