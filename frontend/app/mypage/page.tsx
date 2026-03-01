"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { AuthGuard } from "@/src/components/auth-guard";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { useAuth } from "@/src/contexts/auth-context";
import { apiClient } from "@/src/lib/api";
import { todayDateString } from "@/src/lib/date-utils";
import { DOG_GENDER_OPTIONS, DOG_SIZE_OPTIONS, type DogGender, type DogSizeCategory } from "@/src/lib/dog-form";
import {
  formatReservationDate,
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

function vaccineStatusClass(status: Dog["vaccine_approval_status"]) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = todayDateString();

  const load = useCallback(async () => {
    const [dogData, reservationData, paymentData] = await Promise.all([
      apiClient.getDogs(),
      apiClient.getReservations(),
      apiClient.getPaymentHistory(),
    ]);

    setDogs(dogData);
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
        .sort(
          (a, b) => toDateTimeValue(b.date, b.start_time) - toDateTimeValue(a.date, a.start_time),
        ),
    [reservations],
  );

  const isSetup = useMemo(
    () => Boolean(user && (!user.display_name || !user.phone_number)),
    [user],
  );

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiClient.updateMe(profileForm);
      await refreshProfile();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "犬情報の更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <MobilePage>
        <PageHeader title="MyPage" description="飼い主情報・犬・予約履歴・支払い履歴を管理" />

        <div className="space-y-4 px-4 py-5">
          {isSetup ? (
            <section className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
              初回ログインです。プロフィール登録を完了してください。
            </section>
          ) : null}

          <section className="section-card">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">飼い主情報</h2>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {user?.membership_tier === "premium" ? "PREMIUM会員" : "REGULAR会員"}
              </span>
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

          <section className="section-card">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">登録済みの犬</h2>
              <Link href="/dog-registration" className="text-sm font-semibold text-orange-600">
                犬追加
              </Link>
            </div>

            <div className="space-y-2">
              {dogs.map((dog) => (
                <div key={dog.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{dog.name}</p>
                    <button type="button" onClick={() => startEditDog(dog)} className="text-xs text-orange-600">
                      編集
                    </button>
                  </div>
                  <p className="text-gray-600">
                    {dog.breed}
                    {dog.breed_group ? ` (${dog.breed_group})` : ""} / {dog.weight_kg}kg / {dog.size_category}
                  </p>
                  <p className="text-gray-500">ワクチン期限: {dog.vaccine_expires_on}</p>
                  <p className="mt-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${vaccineStatusClass(dog.vaccine_approval_status)}`}>
                      ワクチン確認: {vaccineStatusLabel(dog.vaccine_approval_status)}
                    </span>
                  </p>
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

          <section className="section-card">
            <h2 className="mb-2 text-base font-bold text-gray-900">利用履歴</h2>
            <div className="space-y-2 text-sm">
              {sortedReservations.map((reservation) => {
                const usageMinutes = deriveUsageMinutes(
                  reservation.checked_in_at,
                  reservation.actual_checked_out_at,
                  reservation.actual_duration_minutes,
                );

                return (
                  <div key={reservation.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="font-semibold text-gray-900">
                      利用日時: {formatReservationDate(reservation.date)} {reservation.start_time.slice(0, 5)} -{" "}
                      {reservation.end_time.slice(0, 5)}
                    </p>
                    {reservation.checked_in_at ? (
                      <p className="text-gray-600">
                        実利用時間: {formatTime(reservation.checked_in_at)} -{" "}
                        {reservation.actual_checked_out_at ? formatTime(reservation.actual_checked_out_at) : "利用中"}{" "}
                        {usageMinutes !== null ? `(${usageMinutes}分)` : ""}
                      </p>
                    ) : (
                      <p className="text-gray-600">実利用時間: 未チェックイン</p>
                    )}
                    <p className="mt-1 text-gray-600">予約日時: {formatDateTime(reservation.created_at)}</p>
                    <p className="text-gray-600">支払日時: {formatDateTime(reservation.paid_at)}</p>
                    <p className="text-gray-600">
                      利用犬:{" "}
                      {reservation.reservation_dogs.length
                        ? reservation.reservation_dogs.map((dog) => dog.dog_name).join(" / ")
                        : "未登録"}
                    </p>
                    <p className="mt-1 text-gray-600">
                      状態: {RESERVATION_STATUS_LABEL[reservation.status] || reservation.status} /{" "}
                      {PAYMENT_STATUS_LABEL[reservation.payment_status] || reservation.payment_status}
                    </p>
                  </div>
                );
              })}
              {!sortedReservations.length ? <p className="text-sm text-gray-500">利用履歴がありません。</p> : null}
            </div>
          </section>

          <section className="section-card">
            <h2 className="mb-2 text-base font-bold text-gray-900">支払い履歴</h2>
            <div className="space-y-2 text-sm">
              {payments.map((payment) => (
                <div key={payment.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="font-semibold text-gray-900">
                    {payment.reservation_date} {payment.reservation_start_time.slice(0, 5)}
                  </p>
                  <p className="text-gray-600">記録日時: {formatDateTime(payment.created_at)}</p>
                  <p className="text-gray-600">
                    {Number(payment.amount).toLocaleString()} {payment.currency.toUpperCase()} /{" "}
                    {PAYMENT_STATUS_LABEL[payment.status] || payment.status}
                  </p>
                </div>
              ))}
              {!payments.length ? <p className="text-sm text-gray-500">支払い履歴がありません。</p> : null}
            </div>
          </section>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </MobilePage>
    </AuthGuard>
  );
}
