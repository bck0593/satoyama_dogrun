"use client";

import Link from "next/link";
import { Clock3, Dog, Radio, Users } from "lucide-react";

import { AuthGuard } from "@/src/components/auth-guard";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { StatusPill } from "@/src/components/status-pill";
import { useLiveStatus } from "@/src/hooks/use-live-status";

function formatTimestamp(value?: string) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function occupancyMessage(rate: number | null) {
  if (rate === null) return "最新の利用頭数を取得しています。";
  if (rate < 40) return "いまは比較的ゆったり利用できます。";
  if (rate < 70) return "通常どおり利用しやすい状況です。";
  if (rate < 100) return "混み合っているため、来場前の確認をおすすめします。";
  return "満員です。空きが出るまでお待ちください。";
}

export default function LiveStatusPage() {
  const { stats, nextTodayReservation, congestionView, utilizationRate } = useLiveStatus();

  return (
    <AuthGuard>
      <MobilePage>
        <PageHeader title="ドッグラン利用状況" description="いま何頭いるか、空きがあるかを現地前に確認できます。" />

        <div className="space-y-4 px-4 py-5">
          <section className="brand-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                tone={
                  stats?.congestion === "full"
                    ? "danger"
                    : stats?.congestion === "high"
                      ? "warning"
                      : stats?.congestion === "low"
                        ? "success"
                        : "brand"
                }
              >
                {congestionView.label}
              </StatusPill>
              <StatusPill tone="neutral">最終更新 {formatTimestamp(stats?.timestamp)}</StatusPill>
            </div>

            <h2 className="mt-3 text-2xl font-black text-[#153a71]">
              {stats ? `${stats.current_dogs}頭 利用中 / 空き ${stats.available}頭` : "利用状況を読み込み中です"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#557196]">{congestionView.description}</p>

            <div className="mt-4 overflow-hidden rounded-full bg-[#dfe8f6]">
              <div
                className={`h-3 rounded-full ${
                  stats?.congestion === "full"
                    ? "bg-red-500"
                    : stats?.congestion === "high"
                      ? "bg-orange-500"
                      : stats?.congestion === "medium"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                }`}
                style={{ width: `${utilizationRate ?? 0}%` }}
              />
            </div>

            <p className="mt-2 text-sm text-[#587195]">
              利用率 {utilizationRate ?? "--"}% / 最大 {stats?.max_capacity ?? "--"}頭
            </p>
            <p className="mt-1 text-sm text-[#587195]">{occupancyMessage(utilizationRate)}</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href={nextTodayReservation ? "/checkin" : "/reservation"}
                className="inline-flex items-center justify-center rounded-xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white"
              >
                {nextTodayReservation ? "本日の予約でチェックイン" : "空きがあれば予約する"}
              </Link>
              <Link
                href="/mypage"
                className="inline-flex items-center justify-center rounded-xl border border-[#cfdbec] bg-white px-4 py-3 text-sm font-bold text-[#11417f]"
              >
                マイページを見る
              </Link>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="section-card">
              <h2 className="flex items-center text-sm font-black text-gray-900">
                <Users className="mr-2 h-4 w-4 text-blue-600" />
                現在の利用頭数
              </h2>
              <p className="mt-3 text-center text-4xl font-black text-gray-900">{stats?.current_dogs ?? "-"}</p>
              <div className="mt-1 flex items-baseline justify-center gap-1 text-sm text-gray-600">
                <span>空き</span>
                <span className="font-semibold tabular-nums">{stats?.available ?? "-"} 頭</span>
              </div>
            </div>

            <div className="section-card">
              <h2 className="flex items-center text-sm font-black text-gray-900">
                <Clock3 className="mr-2 h-4 w-4 text-amber-600" />
                最終更新
              </h2>
              <p className="mt-3 text-center text-3xl font-black text-gray-900">{formatTimestamp(stats?.timestamp)}</p>
              <p className="mt-1 text-sm text-gray-600">自動更新しています</p>
            </div>
          </section>

          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-black text-gray-900">
              <Dog className="mr-2 h-4 w-4 text-indigo-600" />
              犬種ごとの利用状況
            </h2>
            <div className="space-y-2 text-sm">
              {stats?.breed_counts?.length ? (
                stats.breed_counts.map((row) => {
                  const ratio = stats.current_dogs ? Math.max(Math.round((row.count / stats.current_dogs) * 100), 8) : 0;
                  return (
                    <div key={row.breed} className="rounded-2xl border border-[#d9e3f1] bg-[#f8fbff] px-3 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-gray-900">{row.breed}</p>
                        <StatusPill tone="neutral">{row.count}頭</StatusPill>
                      </div>
                      <div className="mt-2 overflow-hidden rounded-full bg-[#dde6f4]">
                        <div className="h-2 rounded-full bg-[#0a438d]" style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">現在チェックイン中の犬はまだいません。</p>
              )}
            </div>
          </section>

          <section className="section-card">
            <h2 className="mb-2 text-base font-black text-gray-900">いまいるわんこ</h2>
            <div className="space-y-2 text-sm">
              {stats?.dogs?.length ? (
                stats.dogs.map((dog, index) => (
                  <div
                    key={`${dog.dog_name}-${index}`}
                    className="flex items-center justify-between rounded-2xl border border-[#dde6f4] bg-[#f8fbff] px-3 py-3"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{dog.dog_name}</p>
                      <p className="text-xs text-gray-500">{dog.breed}</p>
                    </div>
                    <StatusPill tone="neutral">
                      {dog.size_category === "small" ? "小型" : dog.size_category === "medium" ? "中型" : "大型"}
                    </StatusPill>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">現在チェックイン中の犬はまだいません。</p>
              )}
            </div>
          </section>

          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-black text-gray-900">
              <Radio className="mr-2 h-4 w-4 text-[#0a438d]" />
              サイズ別
            </h2>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-2xl bg-emerald-50 px-3 py-3 text-center">
                <p className="text-gray-600">小型</p>
                <p className="text-lg font-black text-emerald-700">{stats?.small_dogs ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-sky-50 px-3 py-3 text-center">
                <p className="text-gray-600">中型</p>
                <p className="text-lg font-black text-sky-700">{stats?.medium_dogs ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 px-3 py-3 text-center">
                <p className="text-gray-600">大型</p>
                <p className="text-lg font-black text-indigo-700">{stats?.large_dogs ?? 0}</p>
              </div>
            </div>
          </section>
        </div>
      </MobilePage>
    </AuthGuard>
  );
}
