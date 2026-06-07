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
  ScanLine,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { StatusPill } from "@/src/components/status-pill";
import { apiClient } from "@/src/lib/api";
import type { Dog as DogProfile, UserProfile } from "@/src/lib/types";

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

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [dogs, setDogs] = useState<DogProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dashboardData, membersData, dogsData] = await Promise.all([
          apiClient.getAdminDashboard(),
          apiClient.getAdminMembers(),
          apiClient.getAdminDogs(),
        ]);
        setDashboard(dashboardData);
        setMembers(membersData);
        setDogs(dogsData);
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
    </div>
  );
}
