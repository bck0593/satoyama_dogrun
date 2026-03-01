"use client";

import { useEffect, useState } from "react";

import { apiClient } from "@/src/lib/api";

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

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Array<{ currency: string; total_amount: number }>>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [salesData, dashboardData] = await Promise.all([apiClient.getAdminSales(), apiClient.getAdminDashboard()]);
        setSales(salesData);
        setDashboard(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "売上データの取得に失敗しました。");
      }
    };
    load().catch(() => null);
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">売上</h2>
        <p className="mt-1 text-sm text-slate-600">通貨別の売上合計と本日売上を確認できます。</p>
        {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">本日売上</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{dashboard?.sales_today ?? "-"}</p>
          <p className="mt-1 text-xs text-slate-500">{dashboard?.today_date}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">決済待ち予約</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{dashboard?.pending_payment ?? "-"}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">本日予約数</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{dashboard?.today_reservations ?? "-"}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">通貨別売上</h3>
        <ul className="mt-3 space-y-2">
          {sales.map((item) => (
            <li key={item.currency} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span className="font-semibold text-slate-700">{item.currency.toUpperCase()}</span>
              <span className="font-bold text-slate-900">{item.total_amount}</span>
            </li>
          ))}
          {!sales.length ? <li className="text-sm text-slate-500">売上データがありません。</li> : null}
        </ul>
      </section>
    </div>
  );
}
