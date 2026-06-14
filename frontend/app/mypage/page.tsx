"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, CreditCard, Dog as DogIcon, History, LogOut, Plus, ShieldAlert, UserCircle2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { AuthGuard } from "@/src/components/auth-guard";
import { DogEditForm } from "@/src/components/dog-edit-form";
import { EmptyState } from "@/src/components/empty-state";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { SectionHeading } from "@/src/components/section-heading";
import { ListSkeleton } from "@/src/components/skeletons";
import { StatusPill } from "@/src/components/status-pill";
import { useAuth } from "@/src/contexts/auth-context";
import { apiClient } from "@/src/lib/api";
import { formatDateTimeJa, todayDateString } from "@/src/lib/date-utils";
import { sizeCategoryLabel, type DogGender, type DogSizeCategory } from "@/src/lib/dog-form";
import { DOG_READINESS_HINT_CLASS, getDogReadiness, isSuspended, sortDogsByReadiness } from "@/src/lib/member-readiness";
import {
  getReservationEndValue,
  paymentHistoryStatusLabel,
  paymentStatusTone,
  toDateTimeValue,
} from "@/src/lib/reservation-display";
import type { Dog, PaymentHistoryItem, Reservation } from "@/src/lib/types";

import { HighlightedPaymentTable } from "./_components/highlighted-payment-table";
import { HighlightedReservationTable } from "./_components/highlighted-reservation-table";
import { ReservationHistoryCard } from "./_components/reservation-history-card";

export default function MyPage() {
  const router = useRouter();
  const { user, refreshProfile, logout } = useAuth();
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
  const [confirmDeleteDogId, setConfirmDeleteDogId] = useState<number | null>(null);
  const [deletingDogId, setDeletingDogId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPastReservations, setShowPastReservations] = useState(false);
  const [showPastPayments, setShowPastPayments] = useState(false);
  const today = todayDateString();

  const load = useCallback(async () => {
    setError(null);
    try {
      const [dogData, reservationData, paymentData] = await Promise.all([
        apiClient.getDogs(),
        apiClient.getReservations(),
        apiClient.getPaymentHistory(),
      ]);

      setDogs(dogData.filter((dog) => dog.is_active));
      setReservations(reservationData);
      setPayments(paymentData);
    } finally {
      setLoading(false);
    }
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
  // 「予約中・これから」= 利用中、または これから利用予定の有効な予約（早い順）
  const upcomingReservations = useMemo(() => {
    const nowValue = Date.now();
    return sortedReservations
      .filter((reservation) => {
        if (reservation.status === "checked_in") return true;
        if (!["pending_payment", "confirmed"].includes(reservation.status)) return false;
        return getReservationEndValue(reservation) >= nowValue;
      })
      .sort((a, b) => toDateTimeValue(a.date, a.start_time) - toDateTimeValue(b.date, b.start_time));
  }, [sortedReservations]);
  const nextReservation = upcomingReservations[0] ?? null;
  const otherUpcomingReservations = useMemo(() => upcomingReservations.slice(1), [upcomingReservations]);
  // 「過去の履歴」= 上記以外（利用完了・キャンセル・過去日など）。最新順。
  const pastReservations = useMemo(() => {
    const upcomingIds = new Set(upcomingReservations.map((reservation) => reservation.id));
    return sortedReservations.filter((reservation) => !upcomingIds.has(reservation.id));
  }, [sortedReservations, upcomingReservations]);
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
  const suspended = useMemo(() => isSuspended(user), [user]);
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

  const handleLogout = () => {
    logout();
    router.replace("/login");
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
    setConfirmDeleteDogId(null);
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
      try {
        const result = await apiClient.cancelReservation(reservation.id, reason);
        await load();
        setNotice(
          result.refund_eligible
            ? `予約 #${reservation.id} をキャンセルしました。返金対象です。返金処理は運営確認後に行われます。`
            : `予約 #${reservation.id} をキャンセルしました。`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "キャンセルに失敗しました。");
      }
    },
    [load],
  );

  return (
    <AuthGuard>
      <MobilePage>
        <PageHeader title="マイページ" description="飼い主情報、犬、予約、支払いをまとめて確認できます" />

        <div className="space-y-4 px-4 py-5">
          {isSetup ? (
            <section className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              初回ログインです。プロフィール登録を完了してください。
            </section>
          ) : null}
          {notice ? (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">{notice}</p>
            </section>
          ) : null}


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
            <SectionHeading icon={UserCircle2} title="飼い主情報" className="mb-3" />
            <form className="space-y-3" onSubmit={saveProfile}>
              <label className="block text-xs font-semibold text-gray-600">
                表示名
                <input
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  value={profileForm.display_name}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, display_name: event.target.value }))}
                  placeholder="山田 太郎"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600">
                メールアドレス
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="example@email.com"
                />
              </label>
              <label className="block text-xs font-semibold text-gray-600">
                電話番号
                <input
                  type="tel"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                  value={profileForm.phone_number}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, phone_number: event.target.value }))}
                  placeholder="090-0000-0000"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? "保存中..." : "プロフィールを更新"}
              </button>
            </form>
          </section>

          <section id="dogs-section" className="section-card">
            <SectionHeading
              icon={DogIcon}
              title="登録済みの犬"
              className="mb-3"
              action={
                <Link
                  href="/dog-registration"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:underline"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  追加
                </Link>
              }
            />

            {loading && !dogs.length ? <ListSkeleton rows={2} /> : null}

            <div className="space-y-2">
              {sortDogsByReadiness(dogs, today).map((dog) => {
                const readiness = getDogReadiness(dog, today);
                const hintClass = DOG_READINESS_HINT_CLASS[readiness.code];
                return (
                <div key={dog.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{dog.name}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <StatusPill tone="neutral">
                          <DogIcon className="mr-1 h-3 w-3" />
                          {sizeCategoryLabel(dog.size_category)}
                        </StatusPill>
                        <StatusPill tone={readiness.tone}>{readiness.label}</StatusPill>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteDogId(null);
                          startEditDog(dog);
                        }}
                        className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-600"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        disabled={deletingDogId === dog.id}
                        onClick={() => setConfirmDeleteDogId(dog.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50"
                      >
                        {deletingDogId === dog.id ? "削除中..." : "削除"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-600">
                    {dog.breed}
                    {dog.breed_group ? ` (${dog.breed_group})` : ""} / {dog.weight_kg}kg / {sizeCategoryLabel(dog.size_category)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">ワクチン期限: {dog.vaccine_expires_on}</p>
                  <p className={`mt-2 flex items-start gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${hintClass}`}>
                    {readiness.code === "ready" ? <span aria-hidden="true">✓</span> : null}
                    <span>{readiness.hint}</span>
                  </p>
                  {readiness.code === "expired" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteDogId(null);
                        startEditDog(dog);
                      }}
                      className="mt-2 inline-flex rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition active:scale-[0.98]"
                    >
                      ワクチン期限を更新する
                    </button>
                  ) : null}

                  {confirmDeleteDogId === dog.id ? (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-sm font-bold text-red-800">「{dog.name}」を削除しますか？</p>
                      <p className="mt-1 text-xs text-red-700">予約履歴に使われている犬情報は残ります。</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={deletingDogId === dog.id}
                          onClick={() => deleteDog(dog).catch(() => null)}
                          className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {deletingDogId === dog.id ? "削除中..." : "削除する"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteDogId(null)}
                          className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {editingDogId === dog.id ? (
                    <DogEditForm
                      form={editingForm}
                      today={today}
                      saving={saving}
                      onChange={(patch) => setEditingForm((prev) => ({ ...prev, ...patch }))}
                      onFileChange={setEditingFile}
                      onSave={saveDog}
                      onCancel={() => setEditingDogId(null)}
                    />
                  ) : null}
                </div>
                );
              })}
              {!loading && !dogs.length ? (
                <EmptyState
                  icon={DogIcon}
                  title="予約に使える犬がいません"
                  description="犬を登録し、ワクチン証明がスタッフに承認されると予約できます。期限切れの犬は「編集」から更新してください。"
                  action={
                    <Link
                      href="/dog-registration"
                      className="inline-flex rounded-xl bg-[#0a438d] px-4 py-2 text-sm font-bold text-white transition active:scale-[0.98]"
                    >
                      犬を登録する
                    </Link>
                  }
                />
              ) : null}
            </div>
          </section>


          <section id="reservations-section" className="section-card">
            <SectionHeading icon={CalendarClock} title="予約中・これからの予約" className="mb-3" />
            <div className="space-y-2 text-sm">
              {loading && !sortedReservations.length ? <ListSkeleton rows={2} /> : null}
              {nextReservation ? (
                <HighlightedReservationTable reservation={nextReservation} onCancel={cancelReservation} />
              ) : !loading ? (
                <div className="rounded-xl border border-dashed border-[#cad8eb] bg-[#f8fbff] p-3 text-sm text-[#587196]">
                  現在有効な予約はありません。新しい予約を入れると、ここに表示されます。
                </div>
              ) : null}
              {otherUpcomingReservations.map((reservation) => (
                <ReservationHistoryCard key={reservation.id} reservation={reservation} onCancel={cancelReservation} />
              ))}
            </div>
          </section>

          <section id="history-section" className="section-card">
            <SectionHeading icon={History} title="過去の利用履歴" className="mb-3" />
            <div className="space-y-2 text-sm">
              {pastReservations.length ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPastReservations((prev) => !prev)}
                    className="w-full rounded-xl border border-[#c9d8ec] bg-white px-4 py-3 text-sm font-semibold text-[#11417f] transition hover:bg-[#f3f7fd]"
                  >
                    {showPastReservations
                      ? `過去の利用履歴を閉じる (${pastReservations.length}件)`
                      : `過去の利用履歴を見る (${pastReservations.length}件)`}
                  </button>
                  {showPastReservations ? (
                    <div className="space-y-2">
                      {pastReservations.map((reservation) => (
                        <ReservationHistoryCard
                          key={reservation.id}
                          reservation={reservation}
                          onCancel={cancelReservation}
                        />
                      ))}
                    </div>
                  ) : null}
                </>
              ) : !loading ? (
                <p className="text-sm text-gray-500">過去の利用履歴はまだありません。</p>
              ) : null}
            </div>
          </section>

          <section className="section-card">
            <SectionHeading icon={CreditCard} title="支払い履歴" className="mb-3" />
            <div className="space-y-2 text-sm">
              {loading && !sortedPayments.length ? <ListSkeleton rows={2} /> : null}
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
                            <p className="mt-1 text-gray-600">記録日時: {formatDateTimeJa(payment.created_at, "未記録")}</p>
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
              {!loading && !sortedPayments.length ? (
                <p className="text-sm text-gray-500">支払い履歴がありません。</p>
              ) : null}
            </div>
          </section>

          {error ? (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">{error}</p>
            </section>
          ) : null}

          <section className="section-card">
            <SectionHeading icon={LogOut} title="アカウント" className="mb-3" />
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d3dded] bg-white px-4 py-3 text-sm font-bold text-[#11417f] transition hover:bg-[#f3f7fd] active:scale-[0.99]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              ログアウト
            </button>
            {user ? (
              <p className="mt-2 text-center text-xs text-gray-400">
                {user.display_name || user.username} としてログイン中
              </p>
            ) : null}
          </section>
        </div>
      </MobilePage>
    </AuthGuard>
  );
}
