"use client";

import { useEffect, useState } from "react";

import { AuthGuard } from "@/src/components/auth-guard";
import { KpiCard } from "@/src/components/kpi-card";
import { TopNav } from "@/src/components/top-nav";
import { apiClient } from "@/src/lib/api";
import type { Dog, Reservation, UserProfile } from "@/src/lib/types";

type Dashboard = {
  today_date: string;
  members: number;
  dogs: number;
  today_reservations: number;
  today_checkins: number;
  active_checkins: number;
  pending_payment: number;
  no_show_today: number;
  sales_today: number;
};

type Member = UserProfile & { dog_count: number };

type CheckinLog = {
  id: number;
  reservation_id: number;
  user_display_name: string;
  action: string;
  source: string;
  scanned_at: string;
};

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [checkins, setCheckins] = useState<CheckinLog[]>([]);
  const [sales, setSales] = useState<Array<{ currency: string; total_amount: number }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardData, membersData, dogsData, reservationsData, checkinsData, salesData] = await Promise.all([
          apiClient.getAdminDashboard(),
          apiClient.getAdminMembers(),
          apiClient.getAdminDogs(),
          apiClient.getAdminReservations(),
          apiClient.getAdminCheckins(),
          apiClient.getAdminSales(),
        ]);

        setDashboard(dashboardData);
        setMembers(membersData);
        setDogs(dogsData);
        setReservations(reservationsData);
        setCheckins(checkinsData);
        setSales(salesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "管理データ取得に失敗しました。");
      }
    };

    load().catch(() => null);
  }, []);

  return (
    <AuthGuard>
      <main className="app-page">
        <TopNav />

        <section className="section-card p-5">
          <h2 className="text-xl font-bold text-slate-900">管理ダッシュボード</h2>
          <p className="mt-1 text-sm text-slate-600">会員管理、犬登録管理、予約管理、利用ログ、売上を横断して確認します。</p>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

          <div className="kpi-grid mt-5">
            <KpiCard label="会員数" value={dashboard?.members ?? "-"} />
            <KpiCard label="登録犬数" value={dashboard?.dogs ?? "-"} />
            <KpiCard label="本日予約" value={dashboard?.today_reservations ?? "-"} />
            <KpiCard label="本日チェックイン" value={dashboard?.today_checkins ?? "-"} />
            <KpiCard label="稼働中" value={dashboard?.active_checkins ?? "-"} />
            <KpiCard label="決済待ち" value={dashboard?.pending_payment ?? "-"} />
            <KpiCard label="no-show" value={dashboard?.no_show_today ?? "-"} />
            <KpiCard label="本日売上" value={dashboard?.sales_today ?? "-"} />
          </div>
        </section>

        <section className="section-card mt-5 p-5">
          <h3 className="text-lg font-bold text-slate-900">会員一覧</h3>
          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-2 py-2">名前</th>
                  <th className="px-2 py-2">メール</th>
                  <th className="px-2 py-2">犬数</th>
                  <th className="px-2 py-2">no-show</th>
                  <th className="px-2 py-2">停止期限</th>
                </tr>
              </thead>
              <tbody>
                {members.slice(0, 20).map((member) => (
                  <tr key={member.id} className="border-b border-slate-100">
                    <td className="px-2 py-2">{member.display_name || member.username}</td>
                    <td className="px-2 py-2">{member.email || "-"}</td>
                    <td className="px-2 py-2">{member.dog_count}</td>
                    <td className="px-2 py-2">{member.no_show_count}</td>
                    <td className="px-2 py-2">{member.suspended_until || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <article className="section-card p-5">
            <h3 className="text-lg font-bold text-slate-900">犬一覧</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {dogs.slice(0, 12).map((dog) => (
                <li key={dog.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  {dog.name} ({dog.breed}) / {dog.size_category}
                  {dog.is_restricted_breed ? " / 危険犬種" : ""}
                </li>
              ))}
            </ul>
          </article>

          <article className="section-card p-5">
            <h3 className="text-lg font-bold text-slate-900">予約一覧</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {reservations.slice(0, 12).map((reservation) => (
                <li key={reservation.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  #{reservation.id} {reservation.date} {reservation.start_time} ({reservation.status}/{reservation.payment_status})
                </li>
              ))}
            </ul>
          </article>

          <article className="section-card p-5">
            <h3 className="text-lg font-bold text-slate-900">利用ログ</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {checkins.slice(0, 12).map((log) => (
                <li key={log.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  #{log.reservation_id} {log.user_display_name} / {log.action} / {log.scanned_at}
                </li>
              ))}
            </ul>
          </article>

          <article className="section-card p-5">
            <h3 className="text-lg font-bold text-slate-900">売上</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {sales.map((item) => (
                <li key={item.currency} className="rounded-lg border border-slate-200 px-3 py-2">
                  {item.currency.toUpperCase()}: {item.total_amount}
                </li>
              ))}
              {!sales.length ? <li className="text-slate-500">売上データなし</li> : null}
            </ul>
          </article>
        </section>
      </main>
    </AuthGuard>
  );
}
