"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { KpiCard } from "@/src/components/kpi-card";
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

const shortcutCards = [
  { href: "/admin/home-content", label: "トップ表示", description: "トップの写真・文言を編集" },
  { href: "/admin/members", label: "会員管理", description: "会員情報と利用停止状況を確認" },
  { href: "/admin/dogs", label: "犬管理", description: "犬情報とワクチン承認を管理" },
  { href: "/admin/reservations", label: "予約管理", description: "予約状況と決済状況を確認" },
  { href: "/admin/checkins", label: "利用状況", description: "犬ごとの利用実績とCSV出力を確認" },
  { href: "/admin/sales", label: "売上", description: "通貨別売上を確認" },
];

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardData, membersData, dogsData, reservationsData] = await Promise.all([
          apiClient.getAdminDashboard(),
          apiClient.getAdminMembers(),
          apiClient.getAdminDogs(),
          apiClient.getAdminReservations(),
        ]);
        setDashboard(dashboardData);
        setMembers(membersData);
        setDogs(dogsData);
        setReservations(reservationsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "管理データの取得に失敗しました。");
      }
    };

    load().catch(() => null);
  }, []);

  const pendingVaccineCount = useMemo(() => dogs.filter((dog) => dog.vaccine_approval_status === "pending").length, [dogs]);
  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const recentMembers = useMemo(() => members.slice(0, 5), [members]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">管理ダッシュボード</h2>
        <p className="mt-1 text-sm text-slate-600">参照元admin構成に合わせて、運営機能をページ単位で管理できるようにしています。</p>
        {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="kpi-grid">
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

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-lg font-bold text-amber-900">要対応</h3>
          <p className="mt-1 text-sm text-amber-700">ワクチン証明のスタッフ承認待ち</p>
          <p className="mt-3 text-3xl font-black text-amber-900">{pendingVaccineCount} 件</p>
          <Link href="/admin/dogs" className="mt-4 inline-block rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-white">
            犬管理へ
          </Link>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">直近会員</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {recentMembers.map((member) => (
              <li key={member.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="font-semibold text-slate-900">{member.display_name || member.username}</p>
                <p className="mt-1 text-xs text-slate-500">{member.email || "メール未登録"}</p>
                <p className="mt-1 text-xs text-slate-500">{member.phone_number || "電話番号未登録"}</p>
                <p className="mt-1 text-xs text-slate-500">LINE ID: {member.line_user_id || "-"}</p>
              </li>
            ))}
            {!recentMembers.length ? <li className="text-slate-500">会員データがありません。</li> : null}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">直近予約</h3>
            <p className="mt-1 text-sm text-slate-600">会員名と連絡先付きで最近の予約を確認できます。</p>
          </div>
          <Link href="/admin/reservations" className="text-sm font-semibold text-blue-700">
            予約管理へ
          </Link>
        </div>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {reservations.slice(0, 6).map((reservation) => {
            const member = memberMap.get(reservation.user);
            return (
              <li key={reservation.id} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-900">
                  #{reservation.id} {reservation.date} {reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}
                </p>
                <p className="mt-2 text-sm text-slate-700">{member?.display_name || member?.username || `会員ID ${reservation.user}`}</p>
                <p className="mt-1 text-xs text-slate-500">{member?.email || "メール未登録"}</p>
                <p className="mt-1 text-xs text-slate-500">{member?.phone_number || "電話番号未登録"}</p>
                <p className="mt-2 text-xs text-slate-500">
                  状態: {reservation.status} / 決済: {reservation.payment_status}
                </p>
              </li>
            );
          })}
          {!reservations.length ? <li className="text-sm text-slate-500">予約データがありません。</li> : null}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shortcutCards.map((card) => (
          <Link key={card.href} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow">
            <h3 className="text-base font-bold text-slate-900">{card.label}</h3>
            <p className="mt-1 text-sm text-slate-600">{card.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
