"use client";

import Link from "next/link";
import { AlertTriangle, CalendarCheck2, Clock3, Wallet } from "lucide-react";
import { useMemo } from "react";

import { HomeHeroSlider } from "@/src/components/home-hero-slider";
import { MobilePage } from "@/src/components/mobile-page";
import { useAuth } from "@/src/contexts/auth-context";
import { useCurrentStats } from "@/src/hooks/use-current-stats";
import { useUserReservations } from "@/src/hooks/use-user-reservations";
import {
  formatReservationDate,
  getUpcomingReservation,
  PAYMENT_STATUS_LABEL,
  RESERVATION_STATUS_LABEL,
} from "@/src/lib/reservation-display";

export default function TopPage() {
  const { user, loading } = useAuth();
  const stats = useCurrentStats();
  const reservations = useUserReservations(Boolean(user));

  const nextReservation = useMemo(() => {
    return getUpcomingReservation(reservations);
  }, [reservations]);

  const userName = user?.display_name || "ゲスト";

  return (
    <MobilePage>
      <div className="space-y-4 px-4 pb-7 pt-4">
        <HomeHeroSlider />

        <section className="rounded-2xl border border-[#ced9ea] bg-white px-4 py-4 text-left shadow-sm">
          <h2 className="text-[20px] font-black leading-tight text-[#0c326d]">
            おかえりなさい、{userName}さん
          </h2>
          <p className="mt-1 text-sm font-medium text-[#3e5f92]">ワンちゃんと素敵な一日を過ごしましょう</p>

          <div className="mt-3 flex items-center gap-3 rounded-xl border-2 border-[#2b5e9a] bg-[#f9fbff] px-3 py-3">
            <div className="h-10 w-10 rounded-full bg-[#d7deea]" />
            <div className="flex-1 space-y-2">
              <div className="h-2.5 w-4/5 rounded-full bg-[#d7deea]" />
              <div className="h-2.5 w-3/5 rounded-full bg-[#e2e8f2]" />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#b8cae3] bg-white shadow-sm">
          <div className="flex items-center gap-2 bg-[#0a3f87] px-4 py-3 text-white">
            <CalendarCheck2 className="h-4 w-4" />
            <p className="text-sm font-bold">次回のご予約</p>
          </div>

          <div className="space-y-3 px-4 py-4">
            {nextReservation ? (
              <div className="rounded-xl border border-[#d0ddee] bg-[#f8fbff] p-3">
                <p className="text-sm font-bold text-[#103f7e]">
                  {formatReservationDate(nextReservation.date)} {nextReservation.start_time.slice(0, 5)} -{" "}
                  {nextReservation.end_time.slice(0, 5)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#e8eff9] px-2.5 py-1 text-xs font-semibold text-[#294f86]">
                    {RESERVATION_STATUS_LABEL[nextReservation.status] || nextReservation.status}
                  </span>
                  <span className="rounded-full bg-[#edf6eb] px-2.5 py-1 text-xs font-semibold text-[#2a6a39]">
                    {PAYMENT_STATUS_LABEL[nextReservation.payment_status] || nextReservation.payment_status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#c5d5eb] bg-[#f8fbff] p-3 text-sm text-[#3b5f94]">
                保育園（1日コース）などの予約情報がここに表示されます。
              </div>
            )}

            <Link
              href={loading || !user ? "/login" : "/reservation"}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#0a3f87] px-4 py-3 text-sm font-bold text-white"
            >
              予約画面へ進む
            </Link>
          </div>
        </section>

        <section className="section-card">
          <h2 className="mb-2 flex items-center text-base font-bold text-[#103970]">
            <AlertTriangle className="mr-2 h-4 w-4 text-[#f0b90b]" />
            ご利用前の注意事項
          </h2>
          <ul className="space-y-1 text-sm text-[#35588f]">
            <li>ワクチン有効期限内の犬のみ入場できます。</li>
            <li>時間帯ごとの頭数上限を超えると予約できません。</li>
            <li>無断キャンセルが続く場合は利用停止になります。</li>
          </ul>
        </section>

        <section className="section-card">
          <h2 className="mb-2 flex items-center text-base font-bold text-[#103970]">
            <Wallet className="mr-2 h-4 w-4 text-[#f0b90b]" />
            利用料金
          </h2>
          <p className="text-sm text-[#35588f]">1頭あたり 1,500円（税込）</p>
          <p className="mt-1 text-xs text-[#5f79a3]">事前決済・QRチェックインで、当日の受付をスムーズにします。</p>
          <Link href="/live-status" className="mt-3 inline-flex items-center text-sm font-semibold text-[#083a82]">
            <Clock3 className="mr-1 h-4 w-4" />
            利用中ステータスを見る
          </Link>
        </section>

        {stats ? (
          <section className="rounded-xl border border-[#d2ddee] bg-white px-3 py-2 text-xs text-[#3f6396]">
            現在の利用頭数: {stats.current_dogs} / {stats.max_capacity} 頭
          </section>
        ) : null}
      </div>
    </MobilePage>
  );
}
