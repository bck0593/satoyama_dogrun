"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarCheck2, ChevronRight, Clock3 } from "lucide-react";
import { useMemo } from "react";

import { HomeHeroSlider } from "@/src/components/home-hero-slider";
import { MobilePage } from "@/src/components/mobile-page";
import { StatusPill } from "@/src/components/status-pill";
import { useAuth } from "@/src/contexts/auth-context";
import { useCurrentStats } from "@/src/hooks/use-current-stats";
import { useUserReservations } from "@/src/hooks/use-user-reservations";
import { todayDateString } from "@/src/lib/date-utils";
import { getCheckedInReservation } from "@/src/lib/member-readiness";
import {
  formatReservationDate,
  getUpcomingReservation,
  PAYMENT_STATUS_LABEL,
  RESERVATION_STATUS_LABEL,
} from "@/src/lib/reservation-display";

function formatTimestamp(value?: string) {
  if (!value) return "更新待ち";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "更新待ち";
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function congestionSummary(congestion?: string) {
  switch (congestion) {
    case "low":
      return {
        label: "空いています",
        detail: "いまは比較的ゆったり利用できます。",
        tone: "success" as const,
      };
    case "medium":
      return {
        label: "やや混雑",
        detail: "通常どおり利用できます。時間帯によっては混み合います。",
        tone: "brand" as const,
      };
    case "high":
      return {
        label: "混雑ぎみ",
        detail: "来場前に利用状況を確認してください。",
        tone: "warning" as const,
      };
    case "full":
      return {
        label: "満員",
        detail: "現在は空きがありません。最新状況を確認してからお越しください。",
        tone: "danger" as const,
      };
    default:
      return {
        label: "確認中",
        detail: "最新の利用状況を取得しています。",
        tone: "neutral" as const,
      };
  }
}

function reservationStatusTone(status: string) {
  switch (status) {
    case "confirmed":
    case "checked_in":
      return "success" as const;
    case "pending_payment":
      return "warning" as const;
    case "cancelled":
    case "no_show":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

function paymentStatusTone(status: string) {
  switch (status) {
    case "paid":
      return "success" as const;
    case "unpaid":
      return "warning" as const;
    case "failed":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export default function TopPage() {
  const { user } = useAuth();
  const stats = useCurrentStats();
  const { reservations, loading: reservationsLoading, error: reservationsError } = useUserReservations(Boolean(user));

  const today = todayDateString();
  const checkedInReservation = useMemo(() => getCheckedInReservation(reservations), [reservations]);
  const nextReservation = useMemo(() => getUpcomingReservation(reservations), [reservations]);
  const latestReservation = useMemo(() => reservations[0] ?? null, [reservations]);
  const crowd = congestionSummary(stats?.congestion);

  return (
    <MobilePage>
      <div className="space-y-4 px-4 pb-7 pt-4">
        <HomeHeroSlider />

        <section className="section-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-[#15396e]">いまの利用状況</h2>
              <p className="mt-1 text-sm text-[#516d95]">{crowd.detail}</p>
            </div>
            <StatusPill tone={crowd.tone}>{crowd.label}</StatusPill>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#f4f8ff] px-3 py-3">
              <p className="text-xs font-semibold text-[#53719a]">利用中</p>
              <p className="mt-1 text-center text-2xl font-black text-[#103f7e]">{stats?.current_dogs ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-[#f7fbf6] px-3 py-3">
              <p className="text-xs font-semibold text-[#557856]">空き</p>
              <p className="mt-1 text-center text-2xl font-black text-emerald-700">{stats?.available ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-[#fff9ec] px-3 py-3">
              <p className="text-xs font-semibold text-[#87672f]">最終更新</p>
              <p className="mt-1 text-center text-xl font-black text-[#946f24]">{formatTimestamp(stats?.timestamp)}</p>
            </div>
          </div>

          <Link href="/live-status" className="mt-4 inline-flex items-center text-sm font-bold text-[#0a438d]">
            利用状況を詳しく見る
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </section>

        <section className="section-card">
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-[#0a438d]" />
            <h2 className="text-base font-black text-[#15396e]">
              {checkedInReservation
                ? `${user?.display_name || "会員"}の現在の利用`
                : user
                  ? `${user.display_name || "会員"}の次の予定`
                  : "次の予定"}
            </h2>
          </div>

          {reservationsLoading ? (
            <div className="mt-3 rounded-2xl border border-dashed border-[#c8d7ea] bg-[#f8fbff] px-4 py-4">
              <p className="text-base font-black text-[#163a70]">予約を確認中です。</p>
              <p className="mt-1 text-sm text-[#5b7397]">最新の予約情報を読み込んでいます。</p>
            </div>
          ) : reservationsError ? (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
              <p className="text-base font-black text-red-700">予約情報を読み込めませんでした。</p>
              <p className="mt-1 text-sm text-red-600">{reservationsError}</p>
              <div className="mt-4 flex gap-2">
                <Link
                  href="/mypage"
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white"
                >
                  マイページで確認
                </Link>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#c9d8ec] bg-white px-4 py-3 text-sm font-bold text-[#11417f]"
                >
                  再読み込み
                </button>
              </div>
            </div>
          ) : checkedInReservation ? (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="success">利用中</StatusPill>
                <StatusPill tone="neutral">本日</StatusPill>
              </div>
              <p className="mt-3 text-lg font-black text-emerald-900">
                {checkedInReservation.end_time.slice(0, 5)} までご利用予定です
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href="/live-status"
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white"
                >
                  利用状況を見る
                </Link>
                <Link
                  href="/mypage"
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-800"
                >
                  マイページを見る
                </Link>
              </div>
            </div>
          ) : nextReservation ? (
            <div className="mt-3 rounded-2xl border border-[#d3dff0] bg-[#f8fbff] px-4 py-4">
              <div className="flex flex-wrap gap-2">
                <StatusPill tone={nextReservation.date === today ? "success" : "brand"}>
                  {nextReservation.date === today ? "本日" : "予約あり"}
                </StatusPill>
                <StatusPill tone={reservationStatusTone(nextReservation.status)}>
                  {RESERVATION_STATUS_LABEL[nextReservation.status] || nextReservation.status}
                </StatusPill>
                <StatusPill tone={paymentStatusTone(nextReservation.payment_status)}>
                  {PAYMENT_STATUS_LABEL[nextReservation.payment_status] || nextReservation.payment_status}
                </StatusPill>
              </div>
              <p className="mt-3 text-lg font-black text-[#123c77]">
                {formatReservationDate(nextReservation.date)} {nextReservation.start_time.slice(0, 5)} -{" "}
                {nextReservation.end_time.slice(0, 5)}
              </p>
              <p className="mt-1 text-sm text-[#557196]">
                利用する犬:{" "}
                {nextReservation.reservation_dogs.length
                  ? nextReservation.reservation_dogs.map((dog) => dog.dog_name).join(" / ")
                  : "未設定"}
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={nextReservation.date === today ? "/checkin" : "/mypage"}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white"
                >
                  {nextReservation.date === today ? "チェックインへ" : "予約内容を見る"}
                </Link>
                <Link
                  href="/reservation"
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#c9d8ec] bg-white px-4 py-3 text-sm font-bold text-[#11417f]"
                >
                  予約する
                </Link>
              </div>
            </div>
          ) : latestReservation ? (
            <div className="mt-3 rounded-2xl border border-[#d9e2ef] bg-white px-4 py-4">
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="neutral">最新の予約状況</StatusPill>
                <StatusPill tone={reservationStatusTone(latestReservation.status)}>
                  {RESERVATION_STATUS_LABEL[latestReservation.status] || latestReservation.status}
                </StatusPill>
                <StatusPill tone={paymentStatusTone(latestReservation.payment_status)}>
                  {PAYMENT_STATUS_LABEL[latestReservation.payment_status] || latestReservation.payment_status}
                </StatusPill>
              </div>
              <p className="mt-3 text-lg font-black text-[#123c77]">
                {formatReservationDate(latestReservation.date)} {latestReservation.start_time.slice(0, 5)} -{" "}
                {latestReservation.end_time.slice(0, 5)}
              </p>
              <p className="mt-1 text-sm text-[#557196]">次の予定はありません。最新の予約状況を表示しています。</p>
              <div className="mt-4 flex gap-2">
                <Link
                  href="/mypage"
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white"
                >
                  マイページで確認
                </Link>
                <Link
                  href="/reservation"
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#c9d8ec] bg-white px-4 py-3 text-sm font-bold text-[#11417f]"
                >
                  予約する
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-[#c8d7ea] bg-[#f8fbff] px-4 py-4">
              <p className="text-base font-black text-[#163a70]">まだ予約はありません。</p>
              <p className="mt-1 text-sm text-[#5b7397]">日付と犬を選ぶだけで、そのまま予約できます。</p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={user ? "/reservation" : "/login"}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white"
                >
                  {user ? "予約する" : "ログインする"}
                </Link>
                <Link
                  href="/live-status"
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#c9d8ec] bg-white px-4 py-3 text-sm font-bold text-[#11417f]"
                >
                  利用状況を見る
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="section-card">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[#d58a00]" />
            <h2 className="text-base font-black text-[#15396e]">利用前の注意</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#4f698f]">
            <li>ワクチン証明が承認済みの犬のみ予約して入場できます。</li>
            <li>本日の予約がある場合は、現地でQRチェックインに進んでください。</li>
            <li>キャンセルが続くと一定期間予約できなくなる場合があります。</li>
          </ul>
        </section>

        <section className="px-2 py-2">
          <Image
            src="/images/fc-imabari-community-logo.jpg"
            alt="FC IMABARI COMMUNITY"
            width={1200}
            height={630}
            className="mx-auto h-auto w-full max-w-[320px] object-contain"
          />
        </section>
      </div>
    </MobilePage>
  );
}
