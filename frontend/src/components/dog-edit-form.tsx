"use client";

import {
  DOG_GENDER_OPTIONS,
  DOG_SIZE_OPTIONS,
  type DogGender,
  type DogSizeCategory,
} from "@/src/lib/dog-form";
import type { Dog } from "@/src/lib/types";

/**
 * Inline editor for an existing dog. Shared by the my-page and dog-registration
 * screens, which both keep the in-progress edit in a `Partial<Dog>` state plus a
 * separately-tracked vaccine image file.
 */
export function DogEditForm({
  form,
  today,
  saving,
  onChange,
  onFileChange,
  onSave,
  onCancel,
}: {
  form: Partial<Dog>;
  today: string;
  saving: boolean;
  onChange: (patch: Partial<Dog>) => void;
  onFileChange: (file: File | null) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-3 space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
      <p className="text-xs font-bold text-orange-800">犬情報を編集</p>
      <label className="block text-xs font-semibold text-gray-600">
        名前
        <input
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          value={form.name ?? ""}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </label>
      <label className="block text-xs font-semibold text-gray-600">
        犬種
        <input
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          value={form.breed ?? ""}
          onChange={(e) => onChange({ breed: e.target.value })}
        />
      </label>
      <label className="block text-xs font-semibold text-gray-600">
        犬種グループ（任意）
        <input
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          placeholder="例: 牧羊犬"
          value={(form.breed_group as string | undefined) ?? ""}
          onChange={(e) => onChange({ breed_group: e.target.value })}
        />
      </label>
      <label className="block text-xs font-semibold text-gray-600">
        体重（kg）
        <input
          type="number"
          min={0.1}
          step={0.1}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          value={form.weight_kg ?? ""}
          onChange={(e) => onChange({ weight_kg: e.target.value })}
        />
      </label>
      <label className="block text-xs font-semibold text-gray-600">
        生年月日
        <input
          type="date"
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          max={today}
          value={form.birth_date ?? ""}
          onChange={(e) => onChange({ birth_date: e.target.value })}
        />
      </label>
      <label className="block text-xs font-semibold text-gray-600">
        性別
        <select
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          value={(form.gender as string | undefined) ?? "unknown"}
          onChange={(e) => onChange({ gender: e.target.value as DogGender })}
        >
          {DOG_GENDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-semibold text-gray-600">
        サイズ
        <select
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          value={(form.size_category as string | undefined) ?? "small"}
          onChange={(e) => onChange({ size_category: e.target.value as DogSizeCategory })}
        >
          {DOG_SIZE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-semibold text-gray-600">
        ワクチン期限
        <input
          type="date"
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          min={today}
          value={form.vaccine_expires_on ?? ""}
          onChange={(e) => onChange({ vaccine_expires_on: e.target.value })}
        />
      </label>
      <label className="block text-xs font-semibold text-gray-600">
        ワクチン証明画像
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
      </label>
      <label className="block text-xs font-semibold text-gray-600">
        備考
        <textarea
          className="mt-1 h-20 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          placeholder="特記事項など"
          value={(form.notes as string | undefined) ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </label>
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        ワクチン証明画像またはワクチン期限を更新すると、再度スタッフ承認待ちになります。
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="flex-1 rounded-lg bg-orange-500 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
