"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/src/lib/api";
import type { Reservation, UserProfile } from "@/src/lib/types";

type Member = UserProfile & { dog_count: number };

function formatDateTime(date: string, time: string) {
  return `${date} ${time}`;
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [membersById, setMembersById] = useState<Record<number, Member>>({});
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [reservationsData, membersData] = await Promise.all([
          apiClient.getAdminReservations(),
          apiClient.getAdminMembers(),
        ]);
        setReservations(reservationsData);
        setMembersById(Object.fromEntries(membersData.map((member) => [member.id, member])));
      } catch (err) {
        setError(err instanceof Error ? err.message : "予約データ取得に失敗しました。");
      }
    };
    load().catch(() => null);
  }, []);

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
      ];
      return haystacks.some((value) => value.toLowerCase().includes(keyword));
    });
  }, [reservations, search, membersById]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">予約管理</h2>
        <p className="mt-1 text-sm text-slate-600">予約日時、利用犬、決済状況を確認できます。</p>
        {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="予約ID / 日付 / 会員名 / 犬名"
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((reservation) => {
                const member = membersById[reservation.user];
                return (
                  <tr key={reservation.id} className="border-b border-slate-100">
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
                    <td className="px-3 py-2">{reservation.status}</td>
                    <td className="px-3 py-2">{reservation.payment_status}</td>
                    <td className="px-3 py-2">
                      {reservation.checked_in_at ? (
                        <div className="text-xs text-slate-700">
                          <p>入場: {new Date(reservation.checked_in_at).toLocaleString("ja-JP")}</p>
                          <p>退場: {reservation.actual_checked_out_at ? new Date(reservation.actual_checked_out_at).toLocaleString("ja-JP") : "-"}</p>
                          <p>滞在: {reservation.actual_duration_minutes ?? "-"} 分</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">未入場</span>
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
