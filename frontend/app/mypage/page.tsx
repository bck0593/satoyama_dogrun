"use client";

import Link from "next/link";
import { ChevronRight, Dog as DogIcon, ShieldAlert, UserCircle2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { AuthGuard } from "@/src/components/auth-guard";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { ReservationCancelDialog } from "@/src/components/reservation-cancel-dialog";
import { StatusPill } from "@/src/components/status-pill";
import { useAuth } from "@/src/contexts/auth-context";
import { apiClient } from "@/src/lib/api";
import { todayDateString } from "@/src/lib/date-utils";
import { DOG_GENDER_OPTIONS, DOG_SIZE_OPTIONS, type DogGender, type DogSizeCategory } from "@/src/lib/dog-form";
import { getPrimaryAction, isProfileComplete, isSuspended, summarizeDogs } from "@/src/lib/member-readiness";
import {
  canCancelReservation,
  CANCELLATION_ROLE_LABEL,
  formatReservationDate,
  getReservationEndValue,
  PAYMENT_STATUS_LABEL,
  RESERVATION_STATUS_LABEL,
  toDateTimeValue,
} from "@/src/lib/reservation-display";
import type { Dog, PaymentHistoryItem, Reservation } from "@/src/lib/types";

function formatDateTime(value: string | null) {
  if (!value) return "未記録";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未記録";
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value: string | null | undefined) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function deriveUsageMinutes(startAt: string | null, endAt: string | null | undefined, fallbackMinutes?: number | null) {
  if (typeof fallbackMinutes === "number") return fallbackMinutes;
  if (!startAt || !endAt) return null;
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.max(Math.floor((end.getTime() - start.getTime()) / 60000), 0);
}

function vaccineStatusLabel(status: Dog["vaccine_approval_status"]) {
  if (status === "approved") return "承認済み";
  if (status === "rejected") return "差し戻し";
  return "確認待ち";
}

function vaccineStatusTone(status: Dog["vaccine_approval_status"]) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  return "warning" as const;
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
    case "created":
      return "neutral" as const;
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

function paymentHistoryStatusLabel(status: PaymentHistoryItem["status"]) {
  switch (status) {
    case "created":
      return "作成済み";
    case "paid":
      return "決済済み";
    case "failed":
      return "決済失敗";
    case "refunded":
      return "返金済み";
    default:
      return status;
  }
}

function ReservationHistoryCard({
  reservation,
  onCancel,
}: {
  reservation: Reservation;
  onCancel: (reservation: Reservation, reason: string) => Promise<void>;
}) {
  const usageMinutes = deriveUsageMinutes(
    reservation.checked_in_at,
    reservation.actual_checked_out_at,
    reservation.actual_duration_minutes,
  );
  const cancellationRoleLabel = reservation.cancelled_by_role
    ? CANCELLATION_ROLE_LABEL[reservation.cancelled_by_role] || reservation.cancelled_by_role
    : null;
  const cancelledByLabel =
    reservation.cancelled_by_role === "user"
      ? "本人"
      : reservation.cancelled_by_display_name || cancellationRoleLabel || "運営";

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={reservationStatusTone(reservation.status)}>
              {RESERVATION_STATUS_LABEL[reservation.status] || reservation.status}
            </StatusPill>
            <StatusPill tone={paymentStatusTone(reservation.payment_status)}>
              {PAYMENT_STATUS_LABEL[reservation.payment_status] || reservation.payment_status}
            </StatusPill>
          </div>
          <p className="mt-2 font-semibold text-gray-900">
            {formatReservationDate(reservation.date)} {reservation.start_time.slice(0, 5)} -{" "}
            {reservation.end_time.slice(0, 5)}
          </p>
        </div>
        {canCancelReservation(reservation) ? (
          <ReservationCancelDialog
            triggerLabel="予約をキャンセル"
            triggerClassName="shrink-0 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            title="この予約をキャンセルしますか"
            description="キャンセル後は元に戻せません。返金対象かどうかは予約時間と決済状況に応じて判定されます。"
            submitLabel="キャンセルする"
            reasonPlaceholder="体調不良、予定変更など"
            helperText="理由は任意です。"
            onSubmit={(reason) => onCancel(reservation, reason)}
          />
        ) : null}
      </div>

      {reservation.checked_in_at ? (
        <p className="mt-2 text-gray-600">
          実利用時間: {formatTime(reservation.checked_in_at)} -{" "}
          {reservation.actual_checked_out_at ? formatTime(reservation.actual_checked_out_at) : "利用中"}{" "}
          {usageMinutes !== null ? `(${usageMinutes}分)` : ""}
        </p>
      ) : (
        <p className="mt-2 text-gray-600">実利用時間: 未チェックイン</p>
      )}
      <p className="mt-1 text-gray-600">予約日時: {formatDateTime(reservation.created_at)}</p>
      <p className="text-gray-600">支払日時: {formatDateTime(reservation.paid_at)}</p>
      <p className="text-gray-600">
        利用犬:{" "}
        {reservation.reservation_dogs.length
          ? reservation.reservation_dogs.map((dog) => dog.dog_name).join(" / ")
          : "未登録"}
      </p>

      {reservation.cancelled_at ? (
        <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>キャンセル日時: {formatDateTime(reservation.cancelled_at)}</p>
          <p>キャンセル者: {cancelledByLabel}</p>
          {reservation.cancel_reason ? <p>理由: {reservation.cancel_reason}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function HighlightedReservationTable({
  reservation,
  onCancel,
}: {
  reservation: Reservation;
  onCancel: (reservation: Reservation, reason: string) => Promise<void>;
}) {
  const usageMinutes = deriveUsageMinutes(
    reservation.checked_in_at,
    reservation.actual_checked_out_at,
    reservation.actual_duration_minutes,
  );

  return (
    <div className="rounded-2xl border border-[#cad8eb] bg-[#f8fbff] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#15396e]">表示中の予約・履歴</p>
          <p className="mt-1 text-sm text-[#587196]">1件だけ先頭に表示しています。</p>
        </div>
        {canCancelReservation(reservation) ? (
          <ReservationCancelDialog
            triggerLabel="予約をキャンセル"
            triggerClassName="shrink-0 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            title="この予約をキャンセルしますか"
            description="キャンセル後は元に戻せません。返金対象かどうかは予約時間と決済状況に応じて判定されます。"
            submitLabel="キャンセルする"
            reasonPlaceholder="理由があれば入力"
            helperText="任意入力です。"
            onSubmit={(reason) => onCancel(reservation, reason)}
          />
        ) : null}
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-white bg-white">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-100">
              <th className="w-24 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">日時</th>
              <td className="px-3 py-2 font-semibold text-slate-900">
                {formatReservationDate(reservation.date)} {reservation.start_time.slice(0, 5)} -{" "}
                {reservation.end_time.slice(0, 5)}
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">状態</th>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={reservationStatusTone(reservation.status)}>
                    {RESERVATION_STATUS_LABEL[reservation.status] || reservation.status}
                  </StatusPill>
                  <StatusPill tone={paymentStatusTone(reservation.payment_status)}>
                    {PAYMENT_STATUS_LABEL[reservation.payment_status] || reservation.payment_status}
                  </StatusPill>
                </div>
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">利用犬</th>
              <td className="px-3 py-2 text-slate-700">
                {reservation.reservation_dogs.length
                  ? reservation.reservation_dogs.map((dog) => dog.dog_name).join(" / ")
                  : "未登録"}
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">予約日時</th>
              <td className="px-3 py-2 text-slate-700">{formatDateTime(reservation.created_at)}</td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">支払日時</th>
              <td className="px-3 py-2 text-slate-700">{formatDateTime(reservation.paid_at)}</td>
            </tr>
            <tr>
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">実利用時間</th>
              <td className="px-3 py-2 text-slate-700">
                {reservation.checked_in_at
                  ? `${formatTime(reservation.checked_in_at)} - ${
                      reservation.actual_checked_out_at ? formatTime(reservation.actual_checked_out_at) : "利用中"
                    }${usageMinutes !== null ? ` (${usageMinutes}分)` : ""}`
                  : "未チェックイン"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HighlightedPaymentTable({ payment }: { payment: PaymentHistoryItem }) {
  return (
    <div className="rounded-2xl border border-[#cad8eb] bg-[#f8fbff] p-3">
      <div>
        <p className="text-sm font-black text-[#15396e]">表示中の支払い履歴</p>
        <p className="mt-1 text-sm text-[#587196]">1件だけ先頭に表示しています。</p>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-white bg-white">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-100">
              <th className="w-24 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">利用日時</th>
              <td className="px-3 py-2 font-semibold text-slate-900">
                {payment.reservation_date} {payment.reservation_start_time.slice(0, 5)}
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">支払い状態</th>
              <td className="px-3 py-2">
                <StatusPill tone={paymentStatusTone(payment.status)}>
                  {paymentHistoryStatusLabel(payment.status)}
                </StatusPill>
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">金額</th>
              <td className="px-3 py-2 text-slate-700">
                {Number(payment.amount).toLocaleString()} {payment.currency.toUpperCase()}
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">返金額</th>
              <td className="px-3 py-2 text-slate-700">
                {Number(payment.refunded_amount).toLocaleString()} {payment.currency.toUpperCase()}
              </td>
            </tr>
            <tr>
              <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500">記録日時</th>
              <td className="px-3 py-2 text-slate-700">{formatDateTime(payment.created_at)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MyPage() {
  const { user, refreshProfile } = useAuth();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);

  const [profileForm, setProfileForm] = useState({
    display_name: "",
    email: "",
    phone_number: "",
  });

  const [editingDogId, setEditingDogId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<Partial<Dog>>({});
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [deletingDogId, setDeletingDogId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPastReservations, setShowPastReservations] = useState(false);
  const [showPastPayments, setShowPastPayments] = useState(false);
  const today = todayDateString();

  const load = useCallback(async () => {
    setError(null);
    const [dogData, reservationData, paymentData] = await Promise.all([
      apiClient.getDogs(),
      apiClient.getReservations(),
      apiClient.getPaymentHistory(),
    ]);

    setDogs(dogData.filter((dog) => dog.is_active));
    setReservations(reservationData);
    setPayments(paymentData);
  }, []);

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      display_name: user.display_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
    });

    load().catch((err) => setError(err instanceof Error ? err.message : "マイページ情報の取得に失敗しました。"));
  }, [load, user]);

  const sortedReservations = useMemo(
    () =>
      [...reservations]
        .filter((reservation) => reservation.status !== "expired")
        .sort((a, b) => toDateTimeValue(b.date, b.start_time) - toDateTimeValue(a.date, a.start_time)),
    [reservations],
  );
  const currentAndUpcomingReservations = useMemo(() => {
    const nowValue = Date.now();
    return sortedReservations.filter((reservation) => {
      if (reservation.status === "checked_in") return true;
      if (!["pending_payment", "confirmed"].includes(reservation.status)) return false;
      return getReservationEndValue(reservation) >= nowValue;
    });
  }, [sortedReservations]);
  const highlightedReservation = useMemo(() => {
    const checkedInReservation = currentAndUpcomingReservations.find((reservation) => reservation.status === "checked_in");
    if (checkedInReservation) return checkedInReservation;

    const nextReservation = [...currentAndUpcomingReservations].sort(
      (a, b) => toDateTimeValue(a.date, a.start_time) - toDateTimeValue(b.date, b.start_time),
    )[0];

    return nextReservation ?? sortedReservations[0] ?? null;
  }, [currentAndUpcomingReservations, sortedReservations]);
  const remainingHistoryReservations = useMemo(
    () =>
      highlightedReservation
        ? sortedReservations.filter((reservation) => reservation.id !== highlightedReservation.id)
        : sortedReservations,
    [highlightedReservation, sortedReservations],
  );
  const sortedPayments = useMemo(
    () =>
      [...payments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [payments],
  );
  const highlightedPayment = useMemo(() => sortedPayments[0] ?? null, [sortedPayments]);
  const remainingPayments = useMemo(
    () =>
      highlightedPayment ? sortedPayments.filter((payment) => payment.id !== highlightedPayment.id) : sortedPayments,
    [highlightedPayment, sortedPayments],
  );
  const profileReady = useMemo(() => isProfileComplete(user), [user]);
  const suspended = useMemo(() => isSuspended(user), [user]);
  const dogSummary = useMemo(() => summarizeDogs(dogs), [dogs]);
  const primaryAction = useMemo(() => getPrimaryAction({ user, dogs, reservations }), [dogs, reservations, user]);
  const primaryActionHref = useMemo(() => {
    if (primaryAction.href !== "/mypage") return primaryAction.href;
    if (!profileReady) return "#profile-section";
    if (!dogSummary.approvedDogs.length) return "#dogs-section";
    return "#history-section";
  }, [dogSummary.approvedDogs.length, primaryAction.href, profileReady]);

  const isSetup = useMemo(() => Boolean(user && (!user.display_name || !user.phone_number)), [user]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      await apiClient.updateMe(profileForm);
      await refreshProfile();
      setNotice("プロフィールを更新しました。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "プロフィール更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const startEditDog = (dog: Dog) => {
    setEditingDogId(dog.id);
    setEditingFile(null);
    setEditingForm({
      name: dog.name,
      breed: dog.breed,
      breed_group: dog.breed_group ?? "",
      weight_kg: dog.weight_kg,
      size_category: dog.size_category,
      gender: dog.gender ?? "unknown",
      birth_date: dog.birth_date,
      vaccine_expires_on: dog.vaccine_expires_on,
      notes: dog.notes,
    });
  };

  const saveDog = async () => {
    if (!editingDogId) return;

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      await apiClient.updateDog(editingDogId, {
        name: editingForm.name,
        breed: editingForm.breed,
        breed_group: editingForm.breed_group ?? undefined,
        weight_kg: editingForm.weight_kg ? Number(editingForm.weight_kg) : undefined,
        size_category: editingForm.size_category as DogSizeCategory | undefined,
        gender: editingForm.gender as DogGender | undefined,
        birth_date: editingForm.birth_date || undefined,
        vaccine_expires_on: editingForm.vaccine_expires_on || undefined,
        notes: editingForm.notes,
        vaccine_proof_image: editingFile,
      });
      setEditingDogId(null);
      await load();
      setNotice("犬情報を更新しました。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "犬情報の更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const deleteDog = async (dog: Dog) => {
    if (!window.confirm(`「${dog.name}」を削除します。予約履歴に使われている犬情報は残ります。`)) {
      return;
    }

    setDeletingDogId(dog.id);
    setError(null);
    setNotice(null);

    try {
      await apiClient.deleteDog(dog.id);
      if (editingDogId === dog.id) {
        setEditingDogId(null);
      }
      setDogs((prev) => prev.filter((item) => item.id !== dog.id));
      setNotice(`「${dog.name}」を削除しました。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "犬情報の削除に失敗しました。");
    } finally {
      setDeletingDogId(null);
    }
  };

  const cancelReservation = useCallback(
    async (reservation: Reservation, reason: string) => {
      setError(null);
      setNotice(null);
      const result = await apiClient.cancelReservation(reservation.id, reason);
      await load();
      setNotice(
        result.refund_eligible
          ? `予約 #${reservation.id} をキャンセルしました。返金対象です。返金処理は運営確認後に行われます。`
          : `予約 #${reservation.id} をキャンセルしました。`,
      );
    },
    [load],
  );

  return (
    <AuthGuard>
      <MobilePage>
        <PageHeader title="MyPage" description="飼い主情報、犬、予約、支払いをまとめて確認できます" />

        <div className="space-y-4 px-4 py-5">
          {isSetup ? (
            <section className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              初回ログインです。プロフィール登録を完了してください。
            </section>
          ) : null}
          {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}

          {false ? <section className="brand-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={profileReady ? "success" : "warning"}>
                {profileReady ? "プロフィール入力済み" : "プロフィール要確認"}
              </StatusPill>
              <StatusPill tone={dogSummary.approvedDogs.length ? "success" : "warning"}>
                予約できる犬 {dogSummary.approvedDogs.length}頭
              </StatusPill>
              {suspended ? <StatusPill tone="danger">利用停止中</StatusPill> : null}
            </div>
            <h2 className="mt-3 text-xl font-black text-[#143a71]">マイページで、準備状況と次の行動をまとめて確認できます。</h2>
            <p className="mt-2 text-sm leading-6 text-[#587196]">{primaryAction.description}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-[#f8fbff] px-3 py-3">
                <p className="text-xs font-semibold text-[#5a7398]">登録犬</p>
                <p className="mt-1 text-2xl font-black text-[#123d77]">{dogSummary.activeDogs.length}</p>
              </div>
              <div className="rounded-2xl bg-[#f7fbf6] px-3 py-3">
                <p className="text-xs font-semibold text-[#5c7a63]">予約可能</p>
                <p className="mt-1 text-2xl font-black text-emerald-700">{dogSummary.approvedDogs.length}</p>
              </div>
              <div className="rounded-2xl bg-[#fff9ec] px-3 py-3">
                <p className="text-xs font-semibold text-[#8d6f34]">承認待ち</p>
                <p className="mt-1 text-2xl font-black text-amber-700">{dogSummary.pendingDogs.length}</p>
              </div>
            </div>
            <Link
              href={primaryActionHref}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#0a438d] px-4 py-3 text-sm font-bold text-white"
            >
              {primaryAction.label}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </section> : null}

          {suspended ? (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-bold">現在は利用停止期間中です。</p>
                  <p className="mt-1">停止解除日までは新しい予約ができません。運営からの案内をご確認ください。</p>
                </div>
              </div>
            </section>
          ) : null}

          <section id="profile-section" className="section-card">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">飼い主情報</h2>
            </div>
            <form className="space-y-2" onSubmit={saveProfile}>
              <input
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
                value={profileForm.display_name}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, display_name: event.target.value }))}
                placeholder="表示名"
              />
              <input
                type="email"
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
                value={profileForm.email}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="メール"
              />
              <input
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
                value={profileForm.phone_number}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, phone_number: event.target.value }))}
                placeholder="電話番号"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                更新
              </button>
            </form>
          </section>

          <section id="dogs-section" className="section-card">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">登録済みの犬</h2>
              <Link href="/dog-registration" className="text-sm font-semibold text-orange-600">
                犬追加
              </Link>
            </div>

            <div className="space-y-2">
              {dogs.map((dog) => (
                <div key={dog.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{dog.name}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <StatusPill tone="neutral">
                          <DogIcon className="mr-1 h-3 w-3" />
                          {dog.size_category === "small" ? "小型犬" : dog.size_category === "medium" ? "中型犬" : "大型犬"}
                        </StatusPill>
                        <StatusPill tone={vaccineStatusTone(dog.vaccine_approval_status)}>
                          ワクチン確認: {vaccineStatusLabel(dog.vaccine_approval_status)}
                        </StatusPill>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => startEditDog(dog)} className="text-xs text-orange-600">
                        編集
                      </button>
                      <button
                        type="button"
                        disabled={deletingDogId === dog.id}
                        onClick={() => deleteDog(dog).catch(() => null)}
                        className="text-xs text-red-600 disabled:opacity-50"
                      >
                        {deletingDogId === dog.id ? "削除中..." : "削除"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-600">
                    {dog.breed}
                    {dog.breed_group ? ` (${dog.breed_group})` : ""} / {dog.weight_kg}kg / {dog.size_category}
                  </p>
                  <p className="text-gray-500">ワクチン期限: {dog.vaccine_expires_on}</p>
                  {dog.vaccine_approval_status === "rejected" && dog.vaccine_review_note ? (
                    <p className="mt-1 text-xs text-red-600">差し戻し理由: {dog.vaccine_review_note}</p>
                  ) : null}

                  {editingDogId === dog.id ? (
                    <div className="mt-2 space-y-2 rounded-lg border border-orange-200 bg-white p-2">
                      <input
                        className="w-full rounded-lg border border-gray-300 px-2 py-1"
                        value={editingForm.name ?? ""}
                        onChange={(event) => setEditingForm((prev) => ({ ...prev, name: event.target.value }))}
                      />
                      <input
                        className="w-full rounded-lg border border-gray-300 px-2 py-1"
                        value={editingForm.breed ?? ""}
                        onChange={(event) => setEditingForm((prev) => ({ ...prev, breed: event.target.value }))}
                      />
                      <input
                        className="w-full rounded-lg border border-gray-300 px-2 py-1"
                        placeholder="犬種グループ (任意)"
                        value={(editingForm.breed_group as string | undefined) ?? ""}
                        onChange={(event) => setEditingForm((prev) => ({ ...prev, breed_group: event.target.value }))}
                      />
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        className="w-full rounded-lg border border-gray-300 px-2 py-1"
                        placeholder="体重(kg)"
                        value={editingForm.weight_kg ?? ""}
                        onChange={(event) => setEditingForm((prev) => ({ ...prev, weight_kg: event.target.value }))}
                      />
                      <input
                        type="date"
                        className="w-full rounded-lg border border-gray-300 px-2 py-1"
                        max={today}
                        value={editingForm.birth_date ?? ""}
                        onChange={(event) => setEditingForm((prev) => ({ ...prev, birth_date: event.target.value }))}
                      />
                      <select
                        className="w-full rounded-lg border border-gray-300 px-2 py-1"
                        value={(editingForm.gender as string | undefined) ?? "unknown"}
                        onChange={(event) => setEditingForm((prev) => ({ ...prev, gender: event.target.value as DogGender }))}
                      >
                        {DOG_GENDER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className="w-full rounded-lg border border-gray-300 px-2 py-1"
                        value={(editingForm.size_category as string | undefined) ?? "small"}
                        onChange={(event) =>
                          setEditingForm((prev) => ({ ...prev, size_category: event.target.value as DogSizeCategory }))
                        }
                      >
                        {DOG_SIZE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-gray-300 px-2 py-1"
                        min={today}
                        value={editingForm.vaccine_expires_on ?? ""}
                        onChange={(event) => setEditingForm((prev) => ({ ...prev, vaccine_expires_on: event.target.value }))}
                      />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="w-full rounded-lg border border-gray-300 px-2 py-1"
                        onChange={(event) => setEditingFile(event.target.files?.[0] ?? null)}
                      />
                      <textarea
                        className="h-20 w-full rounded-lg border border-gray-300 px-2 py-1"
                        placeholder="備考"
                        value={(editingForm.notes as string | undefined) ?? ""}
                        onChange={(event) => setEditingForm((prev) => ({ ...prev, notes: event.target.value }))}
                      />
                      <p className="text-xs text-amber-700">
                        ワクチン証明画像またはワクチン期限を更新すると、再度スタッフ承認待ちになります。
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveDog}
                          className="flex-1 rounded-lg bg-orange-500 px-2 py-1 text-xs font-semibold text-white"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingDogId(null)}
                          className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
              {!dogs.length ? <p className="text-sm text-gray-500">犬登録がありません。</p> : null}
            </div>
          </section>

          {/*
            <div className="mb-2 flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-[#0a438d]" />
              <h2 className="text-base font-bold text-gray-900">利用・利用履歴</h2>
            </div>
            <div className="space-y-2 text-sm">
              {highlightedReservation ? (
                <HighlightedReservationTable reservation={highlightedReservation} onCancel={cancelReservation} />
              [legacy hidden]
              {remainingHistoryReservations.length ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowPastReservations((prev) => !prev)}
                    className="w-full rounded-xl border border-[#c9d8ec] bg-white px-4 py-3 text-sm font-semibold text-[#11417f]"
                  >
                    {showPastReservations
                      ? `過去の利用履歴を閉じる (${remainingHistoryReservations.length}件)`
                      : `過去の利用履歴を参照する (${remainingHistoryReservations.length}件)`}
                  </button>
                  {showPastReservations ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="space-y-2">
                        {remainingHistoryReservations.map((reservation) => (
                          <ReservationHistoryCard
                            key={reservation.id}
                            reservation={reservation}
                            onCancel={cancelReservation}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              [legacy hidden]
              {remainingPayments.length ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowPastPayments((prev) => !prev)}
                    className="w-full rounded-xl border border-[#c9d8ec] bg-white px-4 py-3 text-sm font-semibold text-[#11417f]"
                  >
                    {showPastPayments
                      ? `過去の支払い履歴を閉じる (${remainingPayments.length}件)`
                      : `過去の支払い履歴を参照する (${remainingPayments.length}件)`}
                  </button>
                  {showPastPayments ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="space-y-2">
                        {remainingPayments.map((payment) => (
                          <div key={payment.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900">
                                {payment.reservation_date} {payment.reservation_start_time.slice(0, 5)}
                              </p>
                              <StatusPill tone={paymentStatusTone(payment.status)}>
                                {paymentHistoryStatusLabel(payment.status)}
                              </StatusPill>
                            </div>
                            <p className="mt-1 text-gray-600">記録日時: {formatDateTime(payment.created_at)}</p>
                            <p className="text-gray-600">
                              {Number(payment.amount).toLocaleString()} {payment.currency.toUpperCase()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {!highlightedReservation ? (
                <div className="rounded-xl border border-dashed border-[#cad8eb] bg-[#f8fbff] p-3 text-sm text-[#587196]">
                  次の予定はありません。新しい予約を入れると、ここに表示されます。
                </div>
              ) : null}
              {/*
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowPastReservations((prev) => !prev)}
                    className="w-full rounded-xl border border-[#c9d8ec] bg-white px-4 py-3 text-sm font-semibold text-[#11417f]"
                  >
                    残りの予約・履歴を表示 ({remainingHistoryReservations.length}件)
                  </button>
                  {showPastReservations ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="space-y-2">
                        {remainingHistoryReservations.map((reservation) => (
                          <ReservationHistoryCard
                            key={reservation.id}
                            reservation={reservation}
                            onCancel={cancelReservation}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
              ) : null}
              {!sortedReservations.length ? <p className="text-sm text-gray-500">利用履歴がありません。</p> : null}
            </div>
          </section>

          <section className="section-card">
            <h2 className="mb-2 text-base font-bold text-gray-900">支払い履歴</h2>
            <div className="space-y-2 text-sm">
              {highlightedPayment ? <HighlightedPaymentTable payment={highlightedPayment} /> : null}
              {/*
                <div className="space-y-2">
                  {/*
                    残りの支払い履歴を表示 ({remainingPayments.length}件)
                  [legacy hidden]
                  <p className="text-sm font-semibold text-orange-600">過去の支払い履歴 ({remainingPayments.length}件)</p>
                  <button
                    type="button"
                    onClick={() => setShowPastPayments((prev) => !prev)}
                    className="w-full rounded-xl border border-[#c9d8ec] bg-white px-4 py-3 text-sm font-semibold text-[#11417f]"
                  >
                    {showPastPayments
                      ? `過去の支払い履歴を閉じる (${remainingPayments.length}件)`
                      : `過去の支払い履歴を参照する (${remainingPayments.length}件)`}
                  </button>
                  {showPastPayments ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="space-y-2">
                    {remainingPayments.map((payment) => (
                      <div key={payment.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {payment.reservation_date} {payment.reservation_start_time.slice(0, 5)}
                          </p>
                          <StatusPill tone={paymentStatusTone(payment.status)}>
                            {paymentHistoryStatusLabel(payment.status)}
                          </StatusPill>
                        </div>
                        <p className="mt-1 text-gray-600">險倬鹸譌･譎・ {formatDateTime(payment.created_at)}</p>
                        <p className="text-gray-600">
                          {Number(payment.amount).toLocaleString()} {payment.currency.toUpperCase()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {false ? payments.map((payment) => (
                <div key={payment.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {payment.reservation_date} {payment.reservation_start_time.slice(0, 5)}
                    </p>
                    <StatusPill tone={paymentStatusTone(payment.status)}>
                      {paymentHistoryStatusLabel(payment.status)}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-gray-600">記録日時: {formatDateTime(payment.created_at)}</p>
                  <p className="text-gray-600">
                    {Number(payment.amount).toLocaleString()} {payment.currency.toUpperCase()}
                  </p>
                </div>
              )) : null}
              {!sortedPayments.length ? <p className="text-sm text-gray-500">支払い履歴がありません。</p> : null}
            </div>
          </section>

          */}

          <section id="history-section" className="section-card">
            <div className="mb-2 flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-[#0a438d]" />
              <h2 className="text-base font-bold text-gray-900">利用・利用履歴</h2>
            </div>
            <div className="space-y-2 text-sm">
              {highlightedReservation ? (
                <HighlightedReservationTable reservation={highlightedReservation} onCancel={cancelReservation} />
              ) : (
                <div className="rounded-xl border border-dashed border-[#cad8eb] bg-[#f8fbff] p-3 text-sm text-[#587196]">
                  次の予定はありません。新しい予約を入れると、ここに表示されます。
                </div>
              )}
              {remainingHistoryReservations.length ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowPastReservations((prev) => !prev)}
                    className="w-full rounded-xl border border-[#c9d8ec] bg-white px-4 py-3 text-sm font-semibold text-[#11417f]"
                  >
                    {showPastReservations
                      ? `過去の利用履歴を閉じる (${remainingHistoryReservations.length}件)`
                      : `過去の利用履歴を参照する (${remainingHistoryReservations.length}件)`}
                  </button>
                  {showPastReservations ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="space-y-2">
                        {remainingHistoryReservations.map((reservation) => (
                          <ReservationHistoryCard
                            key={reservation.id}
                            reservation={reservation}
                            onCancel={cancelReservation}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {!sortedReservations.length ? <p className="text-sm text-gray-500">利用履歴がありません。</p> : null}
            </div>
          </section>

          <section className="section-card">
            <h2 className="mb-2 text-base font-bold text-gray-900">支払い履歴</h2>
            <div className="space-y-2 text-sm">
              {highlightedPayment ? <HighlightedPaymentTable payment={highlightedPayment} /> : null}
              {remainingPayments.length ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowPastPayments((prev) => !prev)}
                    className="w-full rounded-xl border border-[#c9d8ec] bg-white px-4 py-3 text-sm font-semibold text-[#11417f]"
                  >
                    {showPastPayments
                      ? `過去の支払い履歴を閉じる (${remainingPayments.length}件)`
                      : `過去の支払い履歴を参照する (${remainingPayments.length}件)`}
                  </button>
                  {showPastPayments ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="space-y-2">
                        {remainingPayments.map((payment) => (
                          <div key={payment.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900">
                                {payment.reservation_date} {payment.reservation_start_time.slice(0, 5)}
                              </p>
                              <StatusPill tone={paymentStatusTone(payment.status)}>
                                {paymentHistoryStatusLabel(payment.status)}
                              </StatusPill>
                            </div>
                            <p className="mt-1 text-gray-600">記録日時: {formatDateTime(payment.created_at)}</p>
                            <p className="text-gray-600">
                              {Number(payment.amount).toLocaleString()} {payment.currency.toUpperCase()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {!sortedPayments.length ? <p className="text-sm text-gray-500">支払い履歴がありません。</p> : null}
            </div>
          </section>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </MobilePage>
    </AuthGuard>
  );
}
