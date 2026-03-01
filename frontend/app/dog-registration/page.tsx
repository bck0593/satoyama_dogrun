"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthGuard } from "@/src/components/auth-guard";
import { MobilePage } from "@/src/components/mobile-page";
import { PageHeader } from "@/src/components/page-header";
import { useDogs } from "@/src/hooks/use-dogs";
import { apiClient } from "@/src/lib/api";
import { todayDateString } from "@/src/lib/date-utils";
import {
  DOG_GENDER_OPTIONS,
  DOG_SIZE_OPTIONS,
  INITIAL_DOG_FORM,
  toDogCreatePayload,
  type DogGender,
  type DogSizeCategory,
} from "@/src/lib/dog-form";

function approvalLabel(status: "pending" | "approved" | "rejected") {
  if (status === "approved") return "承認済み";
  if (status === "rejected") return "差し戻し";
  return "確認待ち";
}

export default function DogRegistrationPage() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_DOG_FORM);
  const [vaccineImage, setVaccineImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { dogs, error: dogsError, reload } = useDogs();
  const today = todayDateString();

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
          <section className="section-card">
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
                value={form.breed}
                onChange={(event) => setForm((prev) => ({ ...prev, breed: event.target.value }))}
                required
              />
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

              {submitError || dogsError ? <p className="text-sm text-red-600">{submitError || dogsError}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "登録中..." : "犬を登録"}
              </button>
            </form>
          </section>

          <section className="section-card">
            <h2 className="text-base font-bold text-gray-900">登録済みの犬</h2>
            <div className="mt-3 space-y-2">
              {dogs.map((dog) => (
                <div key={dog.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  <p className="font-semibold text-gray-900">{dog.name}</p>
                  <p className="text-gray-600">{dog.breed} / {dog.weight_kg}kg / {dog.size_category}</p>
                  <p className="text-xs text-gray-500">ワクチン確認: {approvalLabel(dog.vaccine_approval_status)}</p>
                  {dog.vaccine_approval_status === "rejected" && dog.vaccine_review_note ? (
                    <p className="text-xs text-red-600">差し戻し理由: {dog.vaccine_review_note}</p>
                  ) : null}
                </div>
              ))}
              {!dogs.length ? <p className="text-sm text-gray-500">まだ犬登録がありません。</p> : null}
            </div>
          </section>
        </div>
      </MobilePage>
    </AuthGuard>
  );
}
