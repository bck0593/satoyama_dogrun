"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/src/lib/api";
import type { AdminUsageEntry } from "@/src/lib/types";

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ja-JP");
}

function formatSizeCategory(value: AdminUsageEntry["size_category_snapshot"]) {
  if (value === "small") return "小型犬";
  if (value === "medium") return "中型犬";
  if (value === "large") return "大型犬";
  return value;
}

function formatEntryStatus(entry: AdminUsageEntry) {
  if (entry.status === "in") return `利用中 (${entry.usage_minutes}分)`;
  if (entry.status === "out") return `${entry.usage_minutes}分`;
  return "無効";
}

function downloadCsv(entries: AdminUsageEntry[]) {
  const header = ["利用日", "予約時間", "予約ID", "飼い主", "犬名", "犬種", "分類", "体重kg", "利用時間(分)", "状態", "チェックイン", "チェックアウト", "記録元"];
  const rows = entries.map((entry) => [
    entry.reservation_date ?? "",
    `${entry.reservation_start_time?.slice(0, 5) ?? ""} - ${entry.reservation_end_time?.slice(0, 5) ?? ""}`,
    String(entry.reservation_id),
    entry.user_display_name,
    entry.dog_name_snapshot,
    entry.breed_snapshot,
    formatSizeCategory(entry.size_category_snapshot),
    entry.weight_kg_snapshot,
    String(entry.usage_minutes),
    entry.status,
    formatDateTime(entry.checked_in_at),
    formatDateTime(entry.checked_out_at),
    entry.source,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `dogrun-usage-${today}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminCheckinsPage() {
  const [entries, setEntries] = useState<AdminUsageEntry[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await apiClient.getAdminUsageReport({
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          status: status || undefined,
          search: search || undefined,
        });
        setEntries(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "利用状況の取得に失敗しました。");
      }
    };
    load().catch(() => null);
  }, [dateFrom, dateTo, search, status]);

  const summary = useMemo(() => {
    const totalMinutes = entries.reduce((sum, entry) => sum + entry.usage_minutes, 0);
    const uniqueBreeds = new Set(entries.map((entry) => entry.breed_snapshot)).size;
    const bySize = {
      small: entries.filter((entry) => entry.size_category_snapshot === "small").length,
      medium: entries.filter((entry) => entry.size_category_snapshot === "medium").length,
      large: entries.filter((entry) => entry.size_category_snapshot === "large").length,
    };
    return {
      totalEntries: entries.length,
      totalMinutes,
      uniqueBreeds,
      bySize,
    };
  }, [entries]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">ドッグラン利用状況</h2>
            <p className="mt-1 text-sm text-slate-600">
              いつ、どの犬が、どの犬種・分類で、どれくらい利用したかを一覧確認できます。
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadCsv(entries)}
            disabled={!entries.length}
            className="rounded-lg bg-[#0b2d5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            CSV出力
          </button>
        </div>
        {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">利用件数</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{summary.totalEntries}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">合計利用時間</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{summary.totalMinutes}分</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">犬種数</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{summary.uniqueBreeds}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">分類別件数</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            小型 {summary.bySize.small} / 中型 {summary.bySize.medium} / 大型 {summary.bySize.large}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="犬名 / 犬種 / 飼い主 / 予約ID"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          >
            <option value="">状態: すべて</option>
            <option value="in">利用中</option>
            <option value="out">利用完了</option>
            <option value="invalid">無効</option>
          </select>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700">
                <th className="px-3 py-2">いつ</th>
                <th className="px-3 py-2">犬名</th>
                <th className="px-3 py-2">犬種</th>
                <th className="px-3 py-2">分類</th>
                <th className="px-3 py-2">利用時間</th>
                <th className="px-3 py-2">飼い主</th>
                <th className="px-3 py-2">状態</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-900">
                      {entry.reservation_date} {entry.reservation_start_time?.slice(0, 5)} - {entry.reservation_end_time?.slice(0, 5)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">入場: {formatDateTime(entry.checked_in_at)}</p>
                    <p className="mt-1 text-xs text-slate-500">退場: {formatDateTime(entry.checked_out_at)}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-900">{entry.dog_name_snapshot}</p>
                    <p className="mt-1 text-xs text-slate-500">予約 #{entry.reservation_id}</p>
                  </td>
                  <td className="px-3 py-3">{entry.breed_snapshot}</td>
                  <td className="px-3 py-3">
                    <p>{formatSizeCategory(entry.size_category_snapshot)}</p>
                    <p className="mt-1 text-xs text-slate-500">{entry.weight_kg_snapshot}kg</p>
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-900">{formatEntryStatus(entry)}</td>
                  <td className="px-3 py-3">{entry.user_display_name}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{entry.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!entries.length ? <p className="px-3 py-4 text-sm text-slate-500">該当する利用記録がありません。</p> : null}
      </section>
    </div>
  );
}
