"use client";

import Link from "next/link";
import { Clock3, Dog, PawPrint, Radio, Users } from "lucide-react";

import { EmptyState } from "@/src/components/empty-state";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { SectionHeading } from "@/src/components/section-heading";
import { HeroCardSkeleton, SkeletonRegion, StatCardsSkeleton } from "@/src/components/skeletons";
import { StatusPill } from "@/src/components/status-pill";
import { useLiveStatus } from "@/src/hooks/use-live-status";
import { formatClockJa } from "@/src/lib/date-utils";

export default function LiveStatusPage() {
  const { stats, loading, nextTodayReservation, congestionView, utilizationRate } = useLiveStatus();

  return (
    <MobilePage>
        <PageHeader title="ドッグラン利用状況" description="いま何頭いるか、空きがあるかを現地前に確認できます。" />

        <div className="space-y-4 px-4 py-5">
          {loading && !stats ? (
            <SkeletonRegion label="利用状況を読み込み中">
              <div className="space-y-4">
                <HeroCardSkeleton />
                <StatCardsSkeleton />
              </div>
            </SkeletonRegion>
          ) : (
            <>
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
              <StatusPill tone="neutral">最終更新 {formatClockJa(stats?.timestamp)}</StatusPill>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-[#153a71]">
              {stats ? (
                <>
                  <span className="text-3xl">{stats.current_dogs}</span>
                  <span className="text-base font-bold text-[#557196]"> 頭利用中</span>
                  <span className="mx-1.5 text-[#c3d2e8]">/</span>
                  <span>空き </span>
                  <span className="rounded-md bg-[#fff3c4] px-1.5 text-[#8a6a00]">{stats.available}</span>
                  <span className="text-base font-bold text-[#557196]"> 頭</span>
                </>
              ) : (
                "利用状況を読み込み中です"
              )}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#557196]">{congestionView.description}</p>

            <div className="mt-4 overflow-hidden rounded-full bg-[#dfe8f6]">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
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
              利用率 <span className="font-bold tabular-nums text-[#153a71]">{utilizationRate ?? "--"}%</span> / 最大{" "}
              {stats?.max_capacity ?? "--"}頭
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href={nextTodayReservation ? "/checkin" : "/reservation"}
                className="inline-flex items-center justify-center rounded-xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white transition active:scale-[0.98]"
              >
                {nextTodayReservation ? "本日の予約でチェックイン" : "空きがあれば予約する"}
              </Link>
              <Link
                href="/mypage"
                className="inline-flex items-center justify-center rounded-xl border border-[#cfdbec] bg-white px-4 py-3 text-sm font-bold text-[#11417f] transition active:scale-[0.98]"
              >
                マイページを見る
              </Link>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="section-card">
              <h3 className="flex items-center gap-2 text-sm font-black text-[#13386e]">
                <span className="heading-icon h-6 w-6">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                現在の利用頭数
              </h3>
              <p className="mt-3 text-center text-4xl font-black tabular-nums text-[#0a2d5f]">{stats?.current_dogs ?? "-"}</p>
              <div className="mt-1 flex items-baseline justify-center gap-1 text-sm text-gray-600">
                <span>空き</span>
                <span className="font-semibold tabular-nums">{stats?.available ?? "-"} 頭</span>
              </div>
            </div>

            <div className="section-card">
              <h3 className="flex items-center gap-2 text-sm font-black text-[#13386e]">
                <span className="heading-icon h-6 w-6">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                最終更新
              </h3>
              <p className="mt-3 text-center text-3xl font-black tabular-nums text-[#0a2d5f]">{formatClockJa(stats?.timestamp)}</p>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-gray-600">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
                自動更新しています
              </p>
            </div>
          </section>

          <section className="section-card">
            <SectionHeading icon={Dog} title="犬種ごとの利用状況" className="mb-3" />
            <div className="space-y-2 text-sm">
              {stats?.breed_counts?.length ? (
                stats.breed_counts.map((row) => {
                  const ratio = stats.current_dogs ? Math.max(Math.round((row.count / stats.current_dogs) * 100), 8) : 0;
                  return (
                    <div key={row.breed} className="rounded-2xl border border-[#d9e3f1] bg-[#f8fbff] px-3 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-gray-900">{row.breed}</p>
                        <StatusPill tone="brand">{row.count}頭</StatusPill>
                      </div>
                      <div className="mt-2 overflow-hidden rounded-full bg-[#dde6f4]">
                        <div className="h-2 rounded-full bg-[#0a438d] transition-all duration-500" style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon={PawPrint}
                  title="まだ誰もいません"
                  description="現在チェックイン中の犬はいません。最初の1頭になるかも？"
                />
              )}
            </div>
          </section>

          <section className="section-card">
            <SectionHeading icon={PawPrint} title="いまいるわんこ" className="mb-3" />
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
                <EmptyState
                  icon={PawPrint}
                  title="まだ誰もいません"
                  description="チェックインがあると、ここに遊びにきているわんこが表示されます。"
                />
              )}
            </div>
          </section>

          <section className="section-card">
            <SectionHeading icon={Radio} title="サイズ別" className="mb-3" />
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-2xl bg-emerald-50 px-3 py-3 text-center">
                <p className="text-gray-600">小型</p>
                <p className="text-lg font-black tabular-nums text-emerald-700">{stats?.small_dogs ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-sky-50 px-3 py-3 text-center">
                <p className="text-gray-600">中型</p>
                <p className="text-lg font-black tabular-nums text-sky-700">{stats?.medium_dogs ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 px-3 py-3 text-center">
                <p className="text-gray-600">大型</p>
                <p className="text-lg font-black tabular-nums text-indigo-700">{stats?.large_dogs ?? 0}</p>
              </div>
            </div>
          </section>
            </>
          )}
        </div>
      </MobilePage>
  );
}
