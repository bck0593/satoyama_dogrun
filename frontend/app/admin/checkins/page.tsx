"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/src/lib/api";

type CheckinLog = {
  id: number;
  reservation_id: number;
  user_display_name: string;
  action: string;
  source: string;
  scanned_at: string;
};

export default function AdminCheckinsPage() {
  const [logs, setLogs] = useState<CheckinLog[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await apiClient.getAdminCheckins();
        setLogs(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "入退場ログの取得に失敗しました。");
      }
    };
    load().catch(() => null);
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return logs;
    return logs.filter((log) => {
      const haystacks = [String(log.reservation_id), log.user_display_name, log.action, log.source];
      return haystacks.some((item) => item.toLowerCase().includes(keyword));
    });
  }, [logs, search]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">入退場ログ</h2>
        <p className="mt-1 text-sm text-slate-600">QRチェックインとチェックアウトの履歴を確認できます。</p>
        {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="予約ID / 会員名 / action / source"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700">
                <th className="px-3 py-2">予約ID</th>
                <th className="px-3 py-2">会員名</th>
                <th className="px-3 py-2">action</th>
                <th className="px-3 py-2">source</th>
                <th className="px-3 py-2">時刻</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">#{log.reservation_id}</td>
                  <td className="px-3 py-2">{log.user_display_name}</td>
                  <td className="px-3 py-2">{log.action}</td>
                  <td className="px-3 py-2">{log.source}</td>
                  <td className="px-3 py-2">{new Date(log.scanned_at).toLocaleString("ja-JP")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length ? <p className="px-3 py-4 text-sm text-slate-500">該当するログがありません。</p> : null}
      </section>
    </div>
  );
}
