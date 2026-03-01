"use client";

import { Clock3, Dog, Radio, Users } from "lucide-react";

import { AuthGuard } from "@/src/components/auth-guard";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { useLiveStatus } from "@/src/hooks/use-live-status";

function formatTimestamp(value?: string) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export default function LiveStatusPage() {
  const { stats, currentReservation, congestionView } = useLiveStatus();

  return (
    <AuthGuard>
      <MobilePage>
        <PageHeader title="ドッグラン利用状況" description="いま利用中の頭数と犬種をリアルタイム表示" />

        <div className="space-y-4 px-4 py-5">
          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-bold text-gray-900">
              <Users className="mr-2 h-4 w-4 text-blue-600" />
              現在の利用頭数
            </h2>
            <p className="text-4xl font-extrabold text-gray-900">{stats?.current_dogs ?? "-"}</p>
            <p className="mt-1 text-sm text-gray-600">
              空き {stats?.available ?? "-"} / 最大 {stats?.max_capacity ?? "-"} 頭
            </p>
            <p className="mt-1 text-xs text-gray-500">最終更新: {formatTimestamp(stats?.timestamp)}</p>
          </section>

          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-bold text-gray-900">
              <Radio className="mr-2 h-4 w-4 text-orange-500" />
              混雑度
            </h2>
            <p className={`text-2xl font-bold ${congestionView.color}`}>{congestionView.label}</p>
          </section>

          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-bold text-gray-900">
              <Dog className="mr-2 h-4 w-4 text-indigo-600" />
              今いる犬種
            </h2>
            <div className="space-y-2 text-sm">
              {stats?.breed_counts?.length ? (
                stats.breed_counts.map((row) => (
                  <div key={row.breed} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <p className="font-semibold text-gray-900">{row.breed}</p>
                    <p className="text-gray-700">{row.count} 頭</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">現在チェックイン中の犬はいません。</p>
              )}
            </div>
          </section>

          <section className="section-card">
            <h2 className="mb-2 text-base font-bold text-gray-900">今いるわんこ</h2>
            <div className="space-y-2 text-sm">
              {stats?.dogs?.length ? (
                stats.dogs.map((dog, index) => (
                  <div
                    key={`${dog.dog_name}-${index}`}
                    className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
                  >
                    <p className="font-semibold text-gray-900">{dog.dog_name}</p>
                    <p className="text-gray-700">{dog.breed}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">現在チェックイン中の犬はいません。</p>
              )}
            </div>
          </section>

          <section className="section-card">
            <h2 className="mb-2 text-base font-bold text-gray-900">サイズ内訳</h2>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
                <p className="text-gray-600">小型</p>
                <p className="text-lg font-bold text-emerald-700">{stats?.small_dogs ?? 0}</p>
              </div>
              <div className="rounded-xl bg-sky-50 px-3 py-2 text-center">
                <p className="text-gray-600">中型</p>
                <p className="text-lg font-bold text-sky-700">{stats?.medium_dogs ?? 0}</p>
              </div>
              <div className="rounded-xl bg-indigo-50 px-3 py-2 text-center">
                <p className="text-gray-600">大型</p>
                <p className="text-lg font-bold text-indigo-700">{stats?.large_dogs ?? 0}</p>
              </div>
            </div>
          </section>

          <section className="section-card">
            <h2 className="mb-2 flex items-center text-base font-bold text-gray-900">
              <Clock3 className="mr-2 h-4 w-4 text-blue-600" />
              あなたの利用終了時間
            </h2>
            <p className="text-2xl font-bold text-gray-900">
              {currentReservation ? currentReservation.end_time.slice(0, 5) : "--:--"}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {currentReservation ? `予約ID: ${currentReservation.id}` : "現在チェックイン中の予約はありません"}
            </p>
          </section>
        </div>
      </MobilePage>
    </AuthGuard>
  );
}
