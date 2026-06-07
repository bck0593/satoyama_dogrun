"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthGuard } from "@/src/components/auth-guard";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { useDogs } from "@/src/hooks/use-dogs";
import { apiClient } from "@/src/lib/api";
import { todayDateString } from "@/src/lib/date-utils";
import { DOG_BREED_SUGGESTIONS } from "@/src/lib/dog-breed-suggestions";
import {
  DOG_GENDER_OPTIONS,
  DOG_SIZE_OPTIONS,
  INITIAL_DOG_FORM,
  toDogCreatePayload,
  type DogGender,
  type DogSizeCategory,
} from "@/src/lib/dog-form";
import type { Dog } from "@/src/lib/types";

function approvalLabel(status: "pending" | "approved" | "rejected") {
  if (status === "approved") return "承認済み ✓";
  if (status === "rejected") return "差し戻し";
  return "確認待ち";
}

function approvalClass(status: "pending" | "approved" | "rejected") {
  if (status === "approved") return "text-emerald-700";
  if (status === "rejected") return "text-red-600";
  return "text-amber-700";
}

export default function DogRegistrationPage() {
  const router = useRouter();
  const today = todayDateString();

  // ── 新規登録フォーム ──
  const [form, setForm] = useState(INITIAL_DOG_FORM);
  const [vaccineImage, setVaccineImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { dogs, setDogs, error: dogsError, reload } = useDogs();

  // ── 編集 ──
  const [editingDogId, setEditingDogId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<Partial<Dog>>({});
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // ── 削除 ──
  const [confirmDeleteDogId, setConfirmDeleteDogId] = useState<number | null>(null);
  const [deletingDogId, setDeletingDogId] = useState<number | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const startEdit = (dog: Dog) => {
    setEditingDogId(dog.id);
    setEditingForm({ ...dog });
    setEditingFile(null);
    setConfirmDeleteDogId(null);
  };

  const saveDog = async () => {
    if (!editingDogId) return;
    setSaving(true);
    setActionError(null);
    setNotice(null);
    try {
      const updated = await apiClient.updateDog(editingDogId, {
        name: editingForm.name,
        breed: editingForm.breed,
        breed_group: editingForm.breed_group ?? undefined,
        weight_kg: editingForm.weight_kg ? Number(editingForm.weight_kg) : undefined,
        birth_date: editingForm.birth_date ?? undefined,
        gender: editingForm.gender ?? undefined,
        size_category: editingForm.size_category ?? undefined,
        vaccine_expires_on: editingForm.vaccine_expires_on ?? undefined,
        vaccine_proof_image: editingFile ?? undefined,
        notes: (editingForm.notes as string | undefined) ?? undefined,
      });
      setDogs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingDogId(null);
      setNotice(`「${updated.name}」の情報を更新しました。`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const deleteDog = async (dog: Dog) => {
    setConfirmDeleteDogId(null);
    setDeletingDogId(dog.id);
    setActionError(null);
    setNotice(null);
    try {
      await apiClient.deleteDog(dog.id);
      if (editingDogId === dog.id) setEditingDogId(null);
      setDogs((prev) => prev.filter((item) => item.id !== dog.id));
      setNotice(`「${dog.name}」を削除しました。`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "削除に失敗しました。");
    } finally {
      setDeletingDogId(null);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let payload: ReturnType<typeof toDogCreatePayload>;
    try {
      payload = toDogCreatePayload(form);
      if (!vaccineImage) {
        throw new Error("ワクチン証明画像を選択してください。");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "入力内容を確認してください。");
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      await apiClient.createDog({
        ...payload,
        vaccine_proof_image: vaccineImage,
      });
      setForm(INITIAL_DOG_FORM);
      setVaccineImage(null);
      await reload();
      router.push("/mypage");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "犬登録に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <MobilePage>
        <PageHeader
          title="犬登録"
          description="登録後にスタッフがワクチン証明を確認し、承認後に予約で利用できます"
          backHref="/mypage"
        />

        <div className="space-y-4 px-4 py-5">

          {/* ── 登録済みの犬 ── */}
          <section className="section-card">
            <h2 className="text-base font-bold text-gray-900">登録済みの犬</h2>

            {notice ? (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {notice}
              </div>
            ) : null}
            {actionError ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                {actionError}
              </div>
            ) : null}

            <div className="mt-3 space-y-3">
              {dogs.map((dog) => (
                <div key={dog.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm">
                  {/* 犬の基本情報 */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900">{dog.name}</p>
                      <p className="mt-0.5 text-gray-600">{dog.breed} / {dog.weight_kg}kg / {dog.size_category}</p>
                      <p className={`mt-0.5 text-xs font-semibold ${approvalClass(dog.vaccine_approval_status)}`}>
                        ワクチン確認: {approvalLabel(dog.vaccine_approval_status)}
                      </p>
                      {dog.vaccine_approval_status === "rejected" && dog.vaccine_review_note ? (
                        <p className="mt-1 text-xs text-red-600">差し戻し理由: {dog.vaccine_review_note}</p>
                      ) : null}
                    </div>
                    {/* 編集/削除ボタン */}
                    {editingDogId !== dog.id ? (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(dog)}
                          className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-600 transition hover:bg-orange-50"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDeleteDogId(dog.id);
                            setEditingDogId(null);
                          }}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          削除
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* ワクチン期限切れ警告 */}
                  {dog.vaccine_expires_on < today && editingDogId !== dog.id ? (
                    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                      <p className="text-xs font-bold text-red-700">ワクチン期限切れ: {dog.vaccine_expires_on}</p>
                      <p className="mt-0.5 text-xs text-red-600">予約できません。期限を更新してください。</p>
                      <button
                        type="button"
                        onClick={() => startEdit(dog)}
                        className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        今すぐ更新
                      </button>
                    </div>
                  ) : dog.vaccine_expires_on >= today && editingDogId !== dog.id ? (
                    <p className="mt-1 text-xs text-gray-500">ワクチン期限: {dog.vaccine_expires_on}</p>
                  ) : null}

                  {/* 削除確認 */}
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

                  {/* 編集フォーム */}
                  {editingDogId === dog.id ? (
                    <div className="mt-3 space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
                      <p className="text-xs font-bold text-orange-800">犬情報を編集</p>
                      <label className="block text-xs font-semibold text-gray-600">
                        名前
                        <input
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          value={editingForm.name ?? ""}
                          onChange={(e) => setEditingForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </label>
                      <label className="block text-xs font-semibold text-gray-600">
                        犬種
                        <input
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          value={editingForm.breed ?? ""}
                          onChange={(e) => setEditingForm((prev) => ({ ...prev, breed: e.target.value }))}
                        />
                      </label>
                      <label className="block text-xs font-semibold text-gray-600">
                        犬種グループ（任意）
                        <input
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          value={(editingForm.breed_group as string | undefined) ?? ""}
                          onChange={(e) => setEditingForm((prev) => ({ ...prev, breed_group: e.target.value }))}
                        />
                      </label>
                      <label className="block text-xs font-semibold text-gray-600">
                        体重（kg）
                        <input
                          type="number"
                          min={0.1}
                          step={0.1}
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          value={editingForm.weight_kg ?? ""}
                          onChange={(e) => setEditingForm((prev) => ({ ...prev, weight_kg: e.target.value }))}
                        />
                      </label>
                      <label className="block text-xs font-semibold text-gray-600">
                        生年月日
                        <input
                          type="date"
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          max={today}
                          value={editingForm.birth_date ?? ""}
                          onChange={(e) => setEditingForm((prev) => ({ ...prev, birth_date: e.target.value }))}
                        />
                      </label>
                      <label className="block text-xs font-semibold text-gray-600">
                        性別
                        <select
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          value={(editingForm.gender as string | undefined) ?? "unknown"}
                          onChange={(e) => setEditingForm((prev) => ({ ...prev, gender: e.target.value as DogGender }))}
                        >
                          {DOG_GENDER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs font-semibold text-gray-600">
                        サイズ
                        <select
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          value={(editingForm.size_category as string | undefined) ?? "small"}
                          onChange={(e) => setEditingForm((prev) => ({ ...prev, size_category: e.target.value as DogSizeCategory }))}
                        >
                          {DOG_SIZE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs font-semibold text-gray-600">
                        ワクチン期限
                        <input
                          type="date"
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          min={today}
                          value={editingForm.vaccine_expires_on ?? ""}
                          onChange={(e) => setEditingForm((prev) => ({ ...prev, vaccine_expires_on: e.target.value }))}
                        />
                      </label>
                      <label className="block text-xs font-semibold text-gray-600">
                        ワクチン証明画像
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          onChange={(e) => setEditingFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      <label className="block text-xs font-semibold text-gray-600">
                        備考
                        <textarea
                          className="mt-1 h-20 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                          placeholder="特記事項など"
                          value={(editingForm.notes as string | undefined) ?? ""}
                          onChange={(e) => setEditingForm((prev) => ({ ...prev, notes: e.target.value }))}
                        />
                      </label>
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        ワクチン証明画像またはワクチン期限を更新すると、再度スタッフ承認待ちになります。
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={saveDog}
                          className="flex-1 rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                        >
                          {saving ? "保存中..." : "保存する"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingDogId(null)}
                          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
              {!dogs.length ? <p className="text-sm text-gray-500">まだ犬登録がありません。</p> : null}
            </div>
          </section>

          {/* ── 新規登録フォーム ── */}
          <section className="section-card">
            <h2 className="mb-3 text-base font-bold text-gray-900">新しい犬を登録</h2>
            <form className="space-y-3" onSubmit={onSubmit}>
              <input
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
                placeholder="名前"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <input
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
                placeholder="犬種"
                list="dog-breed-suggestions"
                value={form.breed}
                onChange={(event) => setForm((prev) => ({ ...prev, breed: event.target.value }))}
                required
              />
              <datalist id="dog-breed-suggestions">
                {DOG_BREED_SUGGESTIONS.map((breed) => (
                  <option key={breed} value={breed} />
                ))}
              </datalist>
              <p className="text-xs text-gray-500">候補から選択できます。候補外の犬種は自由入力で登録できます。</p>
              <input
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
                placeholder="犬種グループ (任意)"
                value={form.breed_group}
                onChange={(event) => setForm((prev) => ({ ...prev, breed_group: event.target.value }))}
              />
              <input
                type="number"
                min={0.1}
                step={0.1}
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
                placeholder="体重(kg)"
                value={form.weight_kg}
                onChange={(event) => setForm((prev) => ({ ...prev, weight_kg: event.target.value }))}
                required
              />

              <label className="block text-sm text-gray-700">
                生年月日
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
                  max={today}
                  value={form.birth_date}
                  onChange={(event) => setForm((prev) => ({ ...prev, birth_date: event.target.value }))}
                />
              </label>

              <select
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
                value={form.gender}
                onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value as DogGender }))}
              >
                {DOG_GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
                value={form.size_category}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, size_category: event.target.value as DogSizeCategory }))
                }
              >
                {DOG_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="block text-sm text-gray-700">
                ワクチン期限
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
                  min={today}
                  value={form.vaccine_expires_on}
                  onChange={(event) => setForm((prev) => ({ ...prev, vaccine_expires_on: event.target.value }))}
                  required
                />
              </label>

              <label className="block text-sm text-gray-700">
                ワクチン証明画像
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
                  onChange={(event) => setVaccineImage(event.target.files?.[0] ?? null)}
                  required
                />
              </label>

              <textarea
                className="h-24 w-full rounded-xl border border-gray-300 px-3 py-2"
                placeholder="備考"
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              />

              {submitError || dogsError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {submitError || dogsError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "登録中..." : "犬を登録"}
              </button>
            </form>
          </section>

        </div>
      </MobilePage>
    </AuthGuard>
  );
}
