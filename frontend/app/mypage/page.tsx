"use client";

import Link from "next/link";
import { Dog as DogIcon, ShieldAlert, UserCircle2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { AuthGuard } from "@/src/components/auth-guard";
import { DogEditForm } from "@/src/components/dog-edit-form";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { StatusPill } from "@/src/components/status-pill";
import { useAuth } from "@/src/contexts/auth-context";
import { apiClient } from "@/src/lib/api";
import { formatDateTimeJa, todayDateString } from "@/src/lib/date-utils";
import {
  sizeCategoryLabel,
  vaccineStatusLabel,
  vaccineStatusTone,
  type DogGender,
  type DogSizeCategory,
} from "@/src/lib/dog-form";
import { isSuspended } from "@/src/lib/member-readiness";
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
  const [confirmDeleteDogId, setConfirmDeleteDogId] = useState<number | null>(null);
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
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">飼い主情報</h2>
            </div>
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
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">登録済みの犬</h2>
              <Link href="/dog-registration" className="text-sm font-semibold text-orange-600">
                編集
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
                          {sizeCategoryLabel(dog.size_category)}
                        </StatusPill>
                        <StatusPill tone={vaccineStatusTone(dog.vaccine_approval_status)}>
                          ワクチン確認: {vaccineStatusLabel(dog.vaccine_approval_status)}
                        </StatusPill>
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
                    {dog.breed_group ? ` (${dog.breed_group})` : ""} / {dog.weight_kg}kg / {dog.size_category}
                  </p>
                  {dog.vaccine_expires_on < today ? (
                    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                      <p className="text-xs font-bold text-red-700">ワクチン期限切れ: {dog.vaccine_expires_on}</p>
                      <p className="mt-0.5 text-xs text-red-600">予約には期限の更新が必要です。「編集」から更新してください。</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">ワクチン期限: {dog.vaccine_expires_on}</p>
                  )}
                  {dog.vaccine_approval_status === "rejected" && dog.vaccine_review_note ? (
                    <p className="mt-1 text-xs text-red-600">差し戻し理由: {dog.vaccine_review_note}</p>
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
              ))}
              {!dogs.length ? (
                <div className="rounded-xl border border-dashed border-[#cbd8ea] bg-[#f8fbff] p-4 text-center text-sm text-[#587196]">
                  <p className="font-bold">犬がまだ登録されていません</p>
                  <p className="mt-1">ワクチン証明と一緒に登録すると、承認後に予約できます。</p>
                  <Link
                    href="/dog-registration"
                    className="mt-3 inline-flex rounded-xl bg-[#0a438d] px-4 py-2 text-sm font-bold text-white"
                  >
                    犬を登録する
                  </Link>
                </div>
              ) : null}
            </div>
          </section>


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
              {!sortedPayments.length ? <p className="text-sm text-gray-500">支払い履歴がありません。</p> : null}
            </div>
          </section>

          {error ? (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">{error}</p>
            </section>
          ) : null}
        </div>
      </MobilePage>
    </AuthGuard>
  );
}
