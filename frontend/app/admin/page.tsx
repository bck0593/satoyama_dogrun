"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Dog,
  ImageIcon,
  ScanLine,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { StatusPill } from "@/src/components/status-pill";
import { apiClient } from "@/src/lib/api";
import { PAYMENT_STATUS_LABEL, RESERVATION_STATUS_LABEL, toDateTimeValue } from "@/src/lib/reservation-display";
import type { Dog as DogProfile, Reservation, UserProfile } from "@/src/lib/types";

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
type Tone = "brand" | "success" | "warning" | "danger" | "neutral";

const shortcutCards: Array<{
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
}> = [
  { href: "/admin/reservations", label: "予約管理", description: "本日の予約と決済状況を確認", icon: CalendarDays, tone: "brand" },
  { href: "/admin/dogs", label: "犬管理", description: "ワクチン承認と犬情報を確認", icon: Dog, tone: "warning" },
  { href: "/admin/checkins", label: "利用状況", description: "入退場と利用実績を確認", icon: ScanLine, tone: "success" },
  { href: "/admin/members", label: "会員管理", description: "連絡先と利用停止状況を確認", icon: Users, tone: "neutral" },
  { href: "/admin/sales", label: "売上確認", description: "売上と決済待ちを確認", icon: CreditCard, tone: "brand" },
  { href: "/admin/home-content", label: "トップ表示", description: "トップ写真と文言を編集", icon: ImageIcon, tone: "neutral" },
];

const metricToneClassName: Record<Tone, string> = {
  brand: "border-[#c8daf3] bg-[linear-gradient(180deg,#f5f9ff_0%,#ffffff_100%)]",
  success: "border-emerald-200 bg-[linear-gradient(180deg,#f3fcf7_0%,#ffffff_100%)]",
  warning: "border-amber-200 bg-[linear-gradient(180deg,#fff9ef_0%,#ffffff_100%)]",
  danger: "border-red-200 bg-[linear-gradient(180deg,#fff5f5_0%,#ffffff_100%)]",
  neutral: "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]",
};

const metricIconClassName: Record<Tone, string> = {
  brand: "bg-[#e9f1fe] text-[#0b428d]",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  neutral: "bg-slate-100 text-slate-700",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+09:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "-";
  return `${new Intl.NumberFormat("ja-JP").format(value)}円`;
}

function formatSlot(date: string, startTime: string, endTime: string) {
  return `${formatDate(date)} ${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
}

function isSuspended(value: string | null) {
  if (!value) return false;
  const suspendedUntil = new Date(value);
  return !Number.isNaN(suspendedUntil.getTime()) && suspendedUntil.getTime() > Date.now();
}

function reservationStatusTone(status: string): Tone {
  switch (status) {
    case "confirmed":
    case "checked_in":
      return "success";
    case "pending_payment":
      return "warning";
    case "cancelled":
    case "no_show":
      return "danger";
    default:
      return "neutral";
  }
}

function paymentStatusTone(status: string): Tone {
  switch (status) {
    case "paid":
      return "success";
    case "unpaid":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
  tone: Tone;
}) {
  return (
    <article className={`rounded-3xl border p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] ${metricToneClassName[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
        </div>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${metricIconClassName[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600">{detail}</p>
    </article>
  );
}

function ShortcutTile({
  href,
  label,
  description,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-3xl border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.12)] ${metricToneClassName[tone]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${metricIconClassName[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
      </div>
      <h3 className="mt-4 text-base font-black text-slate-950">{label}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </Link>
  );
}

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [dogs, setDogs] = useState<DogProfile[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
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
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "管理データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    load().catch(() => null);
  }, []);

  const pendingVaccineCount = useMemo(() => dogs.filter((dog) => dog.vaccine_approval_status === "pending").length, [dogs]);
  const memberMap = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const recentMembers = useMemo(() => members.slice(0, 4), [members]);

  const focusReservations = useMemo(() => {
    const activeStatuses = new Set(["pending_payment", "confirmed", "checked_in"]);
    const activeReservations = [...reservations]
      .filter((reservation) => activeStatuses.has(reservation.status))
      .sort((a, b) => toDateTimeValue(a.date, a.start_time) - toDateTimeValue(b.date, b.start_time));

    if (activeReservations.length) {
      return activeReservations.slice(0, 4);
    }

    return reservations.slice(0, 4);
  }, [reservations]);

  const actionItems = useMemo(
    () => [
      {
        href: "/admin/dogs",
        label: "ワクチン承認待ち",
        description:
          pendingVaccineCount > 0 ? "犬管理から承認または差し戻しを処理してください。" : "現在は未処理の申請はありません。",
        count: pendingVaccineCount,
        tone: pendingVaccineCount > 0 ? ("warning" as const) : ("success" as const),
        icon: Dog,
      },
      {
        href: "/admin/reservations",
        label: "決済待ち予約",
        description:
          (dashboard?.pending_payment ?? 0) > 0 ? "支払い未完了の予約があります。" : "未決済の予約はありません。",
        count: dashboard?.pending_payment ?? 0,
        tone: (dashboard?.pending_payment ?? 0) > 0 ? ("warning" as const) : ("success" as const),
        icon: CreditCard,
      },
      {
        href: "/admin/checkins",
        label: "現在利用中",
        description:
          (dashboard?.active_checkins ?? 0) > 0 ? "退場漏れがないか利用状況を確認してください。" : "現在利用中の来場はありません。",
        count: dashboard?.active_checkins ?? 0,
        tone: (dashboard?.active_checkins ?? 0) > 0 ? ("brand" as const) : ("neutral" as const),
        icon: ScanLine,
      },
      {
        href: "/admin/reservations",
        label: "本日の no-show",
        description:
          (dashboard?.no_show_today ?? 0) > 0 ? "無断キャンセルの確認と対応を行ってください。" : "本日の no-show はありません。",
        count: dashboard?.no_show_today ?? 0,
        tone: (dashboard?.no_show_today ?? 0) > 0 ? ("danger" as const) : ("success" as const),
        icon: AlertTriangle,
      },
    ],
    [dashboard?.active_checkins, dashboard?.no_show_today, dashboard?.pending_payment, pendingVaccineCount],
  );

  const actionableCount = useMemo(() => actionItems.filter((item) => item.count > 0).length, [actionItems]);

  const metrics = useMemo(
    () => [
      {
        icon: Users,
        label: "会員数",
        value: dashboard?.members ?? "-",
        detail: `${members.filter((member) => member.dog_count > 0).length}人が犬登録済みです。`,
        tone: "brand" as const,
      },
      {
        icon: Dog,
        label: "登録犬数",
        value: dashboard?.dogs ?? "-",
        detail: `${pendingVaccineCount}件のワクチン確認待ちがあります。`,
        tone: pendingVaccineCount > 0 ? ("warning" as const) : ("neutral" as const),
      },
      {
        icon: CalendarDays,
        label: "本日予約",
        value: dashboard?.today_reservations ?? "-",
        detail: `本日チェックイン ${dashboard?.today_checkins ?? "-"}件`,
        tone: "brand" as const,
      },
      {
        icon: ScanLine,
        label: "現在利用中",
        value: dashboard?.active_checkins ?? "-",
        detail: (dashboard?.active_checkins ?? 0) > 0 ? "現地の利用状況を確認できます。" : "現在利用中の来場はありません。",
        tone: (dashboard?.active_checkins ?? 0) > 0 ? ("success" as const) : ("neutral" as const),
      },
      {
        icon: Clock3,
        label: "決済待ち",
        value: dashboard?.pending_payment ?? "-",
        detail: (dashboard?.pending_payment ?? 0) > 0 ? "予約確定前の確認が必要です。" : "未処理はありません。",
        tone: (dashboard?.pending_payment ?? 0) > 0 ? ("warning" as const) : ("success" as const),
      },
      {
        icon: CreditCard,
        label: "本日売上",
        value: dashboard ? formatCurrency(dashboard.sales_today) : "-",
        detail: `no-show ${dashboard?.no_show_today ?? "-"}件`,
        tone: "brand" as const,
      },
    ],
    [dashboard, members, pendingVaccineCount],
  );

  return (
    <div className="space-y-6 pb-6">
      <section className="brand-card overflow-hidden">
        <div className="grid gap-5 bg-[linear-gradient(135deg,#0b2d5f_0%,#14498e_58%,#e9f1fd_58%,#f8fbff_100%)] p-5 lg:grid-cols-[1.45fr_0.95fr] lg:p-6">
          <div className="text-white">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="neutral" className="border-white/15 bg-white/10 text-white">
                {dashboard?.today_date ? `${formatDate(dashboard.today_date)} の運営状況` : "運営ダッシュボード"}
              </StatusPill>
              {loading ? (
                <StatusPill tone="neutral" className="border-white/15 bg-white/10 text-white">
                  読み込み中
                </StatusPill>
              ) : actionableCount > 0 ? (
                <StatusPill tone="warning">要確認 {actionableCount} 件</StatusPill>
              ) : (
                <StatusPill tone="success">緊急対応はありません</StatusPill>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-black leading-tight md:text-[2.2rem]">
              今日どこを見るべきかが、
              <br />
              すぐ分かる管理画面にします。
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-50/95">
              数値の一覧ではなく、優先対応、現地運用、予約確認を上から順に見られる構成にしています。
              スマホでもPCでも、最初の数秒で判断できることを優先しています。
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold tracking-[0.08em] text-blue-100">本日予約</p>
                <p className="mt-2 text-3xl font-black">{dashboard?.today_reservations ?? "-"}</p>
                <p className="mt-1 text-xs text-blue-100">チェックイン {dashboard?.today_checkins ?? "-"}件</p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold tracking-[0.08em] text-blue-100">利用中</p>
                <p className="mt-2 text-3xl font-black">{dashboard?.active_checkins ?? "-"}</p>
                <p className="mt-1 text-xs text-blue-100">現地の滞在状況を確認</p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold tracking-[0.08em] text-blue-100">本日売上</p>
                <p className="mt-2 text-3xl font-black">{dashboard ? formatCurrency(dashboard.sales_today) : "-"}</p>
                <p className="mt-1 text-xs text-blue-100">決済待ち {dashboard?.pending_payment ?? "-"}件</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/admin/reservations"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#0b2d5f] shadow-[0_10px_26px_rgba(11,45,95,0.18)]"
              >
                予約を確認する
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin/dogs"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur"
              >
                承認待ちを確認
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#d8e3f2] bg-white/92 p-5 shadow-[0_18px_40px_rgba(11,45,95,0.16)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">今日の優先事項</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {actionableCount > 0 ? `${actionableCount}項目の確認が必要です` : "対応待ちはありません"}
                </h2>
              </div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#0b428d]">
                {actionableCount > 0 ? <ShieldAlert className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {actionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-[#bfd4f2] hover:bg-[#f8fbff]"
                  >
                    <div className="flex min-w-0 gap-3">
                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${metricIconClassName[item.tone]}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-950">{item.label}</p>
                          <StatusPill tone={item.tone}>{item.count}件</StatusPill>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
            tone={metric.tone}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="brand-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">要対応</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">いま手を付ける順番</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                犬の承認、決済待ち、利用中、no-show の順に確認できるように並べています。
              </p>
            </div>
            <StatusPill tone={actionableCount > 0 ? "warning" : "success"}>
              {actionableCount > 0 ? `${actionableCount}件に対応` : "対応なし"}
            </StatusPill>
          </div>

          <div className="mt-4 space-y-3">
            {actionItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 transition hover:border-[#c8daf3] hover:bg-[#f8fbff]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-700">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-950">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusPill tone={item.tone}>{item.count}件</StatusPill>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </article>

        <article className="brand-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">直近会員</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">新しい会員の状態</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                連絡先、犬登録の有無、利用停止状態を一枚で確認できます。
              </p>
            </div>
            <Link href="/admin/members" className="text-sm font-bold text-[#0b428d]">
              会員一覧へ
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentMembers.map((member) => (
              <article
                key={member.id}
                className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-950">{member.display_name || member.username}</p>
                    <p className="mt-1 text-sm text-slate-600">{member.email || "メール未登録"}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {member.is_staff ? <StatusPill tone="neutral">運営者</StatusPill> : null}
                    <StatusPill tone={member.dog_count > 0 ? "brand" : "neutral"}>
                      {member.dog_count > 0 ? `犬 ${member.dog_count}頭` : "犬未登録"}
                    </StatusPill>
                    {isSuspended(member.suspended_until) ? <StatusPill tone="danger">利用停止中</StatusPill> : null}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p>{member.phone_number || "電話番号未登録"}</p>
                  <p className="sm:text-right">LINE ID: {member.line_user_id || "-"}</p>
                  <p>登録日: {formatDate(member.created_at)}</p>
                  <p className="sm:text-right">
                    {member.suspended_until ? `停止期限: ${formatDate(member.suspended_until)}` : "利用停止なし"}
                  </p>
                </div>
              </article>
            ))}
            {!recentMembers.length && !loading ? (
              <div className="rounded-3xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                会員データがまだありません。
              </div>
            ) : null}
          </div>
        </article>
      </section>

      <section className="brand-card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">予約確認</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">優先して見たい予約</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              利用中、当日予約、近い予約を優先して表示します。状態と決済の両方を同じ場所で確認できます。
            </p>
          </div>
          <Link href="/admin/reservations" className="text-sm font-bold text-[#0b428d]">
            予約一覧へ
          </Link>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {focusReservations.map((reservation) => {
            const member = memberMap.get(reservation.user);
            const dogNames =
              reservation.reservation_dogs.length > 0
                ? reservation.reservation_dogs.map((dog) => dog.dog_name).join(" / ")
                : `${reservation.party_size}名`;

            return (
              <article
                key={reservation.id}
                className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_10px_22px_rgba(15,23,42,0.06)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-slate-950">
                    #{reservation.id} {formatSlot(reservation.date, reservation.start_time, reservation.end_time)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <StatusPill tone={reservationStatusTone(reservation.status)}>
                      {RESERVATION_STATUS_LABEL[reservation.status] || reservation.status}
                    </StatusPill>
                    <StatusPill tone={paymentStatusTone(reservation.payment_status)}>
                      {PAYMENT_STATUS_LABEL[reservation.payment_status] || reservation.payment_status}
                    </StatusPill>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-base font-bold text-slate-950">
                    {member?.display_name || member?.username || `会員ID ${reservation.user}`}
                  </p>
                  <p className="text-sm text-slate-600">{member?.email || "メール未登録"}</p>
                  <p className="text-sm text-slate-600">{member?.phone_number || "電話番号未登録"}</p>
                  <p className="text-sm text-slate-700">利用犬: {dogNames}</p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm text-slate-600">
                  <p>{reservation.checked_in_at ? "すでにチェックイン済みです。" : "現地運用前に内容を確認してください。"}</p>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </div>
              </article>
            );
          })}

          {!focusReservations.length && !loading ? (
            <div className="rounded-3xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 xl:col-span-2">
              確認対象の予約はありません。
            </div>
          ) : null}
        </div>
      </section>

      <section className="brand-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">クイック操作</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">よく使う管理ページ</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shortcutCards.map((card) => (
            <ShortcutTile
              key={card.href}
              href={card.href}
              label={card.label}
              description={card.description}
              icon={card.icon}
              tone={card.tone}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
