import { StatusPill } from "@/src/components/status-pill";
import { formatDateTimeJa } from "@/src/lib/date-utils";
import { paymentHistoryStatusLabel, paymentStatusTone } from "@/src/lib/reservation-display";
import type { PaymentHistoryItem } from "@/src/lib/types";

export function HighlightedPaymentTable({ payment }: { payment: PaymentHistoryItem }) {
  return (
    <div className="rounded-2xl border border-[#cad8eb] bg-[#f8fbff] p-3">
      <div>
        <p className="text-sm font-black text-[#15396e]">表示中の支払い履歴</p>
        <p className="mt-1 text-sm text-[#587196]">1件だけ先頭に表示しています。</p>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-white bg-white">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-100">
              <th className="w-24 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">利用日時</th>
              <td className="px-3 py-2 font-semibold text-slate-900">
                {payment.reservation_date} {payment.reservation_start_time.slice(0, 5)}
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">支払い状態</th>
              <td className="px-3 py-2">
                <StatusPill tone={paymentStatusTone(payment.status)}>
                  {paymentHistoryStatusLabel(payment.status)}
                </StatusPill>
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">金額</th>
              <td className="px-3 py-2 text-slate-700">
                {Number(payment.amount).toLocaleString()} {payment.currency.toUpperCase()}
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">返金額</th>
              <td className="px-3 py-2 text-slate-700">
                {Number(payment.refunded_amount).toLocaleString()} {payment.currency.toUpperCase()}
              </td>
            </tr>
            <tr>
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">記録日時</th>
              <td className="px-3 py-2 text-slate-700">{formatDateTimeJa(payment.created_at, "未記録")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
