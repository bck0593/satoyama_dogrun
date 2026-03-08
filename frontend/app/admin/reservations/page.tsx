"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ReservationCancelDialog } from "@/src/components/reservation-cancel-dialog";
import { apiClient } from "@/src/lib/api";
import {
  canCancelReservation,
  CANCELLATION_ROLE_LABEL,
  PAYMENT_STATUS_LABEL,
  RESERVATION_STATUS_LABEL,
} from "@/src/lib/reservation-display";
import type { Reservation, UserProfile } from "@/src/lib/types";

type Member = UserProfile & { dog_count: number };

function formatDateTime(date: string, time: string) {
  return `${date} ${time.slice(0, 5)}`;
}

function formatTimestamp(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [membersById, setMembersById] = useState<Record<number, Member>>({});
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [reservationsData, membersData] = await Promise.all([
      apiClient.getAdminReservations(),
      apiClient.getAdminMembers(),
    ]);
    setReservations(reservationsData);
    setMembersById(Object.fromEntries(membersData.map((member) => [member.id, member])));
  }, []);

  useEffect(() => {
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "予約データ取得に失敗しました。"));
  }, [load]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return reservations;
    return reservations.filter((reservation) => {
      const member = membersById[reservation.user];
      const dogNames = reservation.reservation_dogs.map((item) => item.dog_name).join(" ");
      const haystacks = [
        String(reservation.id),
        reservation.date,
        member?.display_name || "",
        member?.email || "",
        dogNames,
        reservation.cancel_reason || "",
        reservation.cancelled_by_display_name || "",
      ];
      return haystacks.some((value) => value.toLowerCase().includes(keyword));
    });
  }, [reservations, search, membersById]);

  const cancelReservation = useCallback(
    async (reservation: Reservation, reason: string) => {
      setError(null);
      setNotice(null);
      const result = await apiClient.cancelReservation(reservation.id, reason);
      await load();
      setNotice(
        result.refund_eligible
          ? `予約 #${reservation.id} を運営側でキャンセルしました。返金対象です。返金処理は別途対応が必要です。`
          : `予約 #${reservation.id} を運営側でキャンセルしました。`,
      );
    },
    [load],
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">予約管理</h2>
        <p className="mt-1 text-sm text-slate-600">予約日時、利用犬、決済状況、キャンセル履歴を確認できます。</p>
        {notice ? <p className="mt-2 text-sm font-semibold text-emerald-700">{notice}</p> : null}
        {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="予約ID / 日付 / 会員名 / 犬名 / キャンセル理由"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700">
                <th className="px-3 py-2">予約</th>
                <th className="px-3 py-2">会員</th>
                <th className="px-3 py-2">利用犬</th>
                <th className="px-3 py-2">状態</th>
                <th className="px-3 py-2">決済</th>
                <th className="px-3 py-2">利用実績</th>
                <th className="px-3 py-2">キャンセル履歴</th>
                <th className="px-3 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((reservation) => {
                const member = membersById[reservation.user];
                const cancellationRoleLabel = reservation.cancelled_by_role
                  ? CANCELLATION_ROLE_LABEL[reservation.cancelled_by_role] || reservation.cancelled_by_role
                  : null;
                const cancelledByLabel =
                  reservation.cancelled_by_role === "user"
                    ? member?.display_name || member?.username || `user#${reservation.user}`
                    : reservation.cancelled_by_display_name || cancellationRoleLabel || "-";

                return (
                  <tr key={reservation.id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-900">#{reservation.id}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(reservation.date, reservation.start_time)}</p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-900">{member?.display_name || `user#${reservation.user}`}</p>
                      <p className="text-xs text-slate-500">{member?.email || "-"}</p>
                    </td>
                    <td className="px-3 py-2">
                      {reservation.reservation_dogs.map((item) => item.dog_name).join(", ") || "-"}
                    </td>
                    <td className="px-3 py-2">
                      {RESERVATION_STATUS_LABEL[reservation.status] || reservation.status}
                    </td>
                    <td className="px-3 py-2">
                      {PAYMENT_STATUS_LABEL[reservation.payment_status] || reservation.payment_status}
                    </td>
                    <td className="px-3 py-2">
                      {reservation.checked_in_at ? (
                        <div className="text-xs text-slate-700">
                          <p>入場: {new Date(reservation.checked_in_at).toLocaleString("ja-JP")}</p>
                          <p>
                            退場:{" "}
                            {reservation.actual_checked_out_at
                              ? new Date(reservation.actual_checked_out_at).toLocaleString("ja-JP")
                              : "-"}
                          </p>
                          <p>滞在: {reservation.actual_duration_minutes ?? "-"} 分</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">未入場</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {reservation.cancelled_at ? (
                        <div className="text-xs text-slate-700">
                          <p>日時: {formatTimestamp(reservation.cancelled_at)}</p>
                          <p>実行者: {cancelledByLabel}</p>
                          {cancellationRoleLabel ? <p>区分: {cancellationRoleLabel}</p> : null}
                          {reservation.cancel_reason ? <p>理由: {reservation.cancel_reason}</p> : null}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">未キャンセル</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {canCancelReservation(reservation) ? (
                        <ReservationCancelDialog
                          triggerLabel="運営でキャンセル"
                          triggerClassName="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                          title={`予約 #${reservation.id} を運営側でキャンセルしますか`}
                          description="ユーザーの代わりに予約を取り消します。理由は会員対応履歴として残ります。"
                          submitLabel="キャンセルを確定"
                          reasonPlaceholder="例: 問い合わせ対応、重複予約、施設都合"
                          reasonRequired
                          helperText="運営側キャンセルでは理由が必須です。"
                          onSubmit={(reason) => cancelReservation(reservation, reason)}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">操作不可</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length ? <p className="px-3 py-4 text-sm text-slate-500">該当する予約がありません。</p> : null}
      </section>
    </div>
  );
}
