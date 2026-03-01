"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/src/lib/api";
import { resolveMediaUrl } from "@/src/lib/media";
import type { HomeHeroSlide } from "@/src/lib/types";

type CreateForm = {
  title: string;
  description: string;
  alt_text: string;
  display_order: number;
  is_active: boolean;
  image: File | null;
};

type EditableField = "title" | "description" | "alt_text" | "display_order" | "is_active";

const INITIAL_CREATE_FORM: CreateForm = {
  title: "",
  description: "",
  alt_text: "",
  display_order: 0,
  is_active: true,
  image: null,
};

function sortSlides(slides: HomeHeroSlide[]) {
  return [...slides].sort((a, b) => a.display_order - b.display_order || a.id - b.id);
}

export default function AdminHomeContentPage() {
  const [slides, setSlides] = useState<HomeHeroSlide[]>([]);
  const [replaceImages, setReplaceImages] = useState<Record<number, File | null>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(INITIAL_CREATE_FORM);
  const [createImageInputKey, setCreateImageInputKey] = useState(0);

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const payload = await apiClient.getAdminHomeHeroSlides();
        setSlides(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "トップ表示データの取得に失敗しました。");
      }
    };

    loadSlides().catch(() => null);
  }, []);

  const sortedSlides = useMemo(() => sortSlides(slides), [slides]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const updateSlideField = (slideId: number, key: EditableField, value: string | number | boolean) => {
    setSlides((prev) => prev.map((slide) => (slide.id === slideId ? { ...slide, [key]: value } : slide)));
  };

  const handleSaveSlide = async (slide: HomeHeroSlide) => {
    setSavingId(slide.id);
    clearMessages();

    try {
      const updated = await apiClient.updateAdminHomeHeroSlide(slide.id, {
        title: slide.title,
        description: slide.description,
        alt_text: slide.alt_text,
        display_order: slide.display_order,
        is_active: slide.is_active,
        image: replaceImages[slide.id] ?? undefined,
      });
      setSlides((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setReplaceImages((prev) => ({ ...prev, [slide.id]: null }));
      setSuccess("スライドを更新しました。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました。");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteSlide = async (slideId: number) => {
    const shouldDelete = window.confirm("このスライドを削除しますか？");
    if (!shouldDelete) return;

    setDeletingId(slideId);
    clearMessages();

    try {
      await apiClient.deleteAdminHomeHeroSlide(slideId);
      setSlides((prev) => prev.filter((slide) => slide.id !== slideId));
      setSuccess("スライドを削除しました。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました。");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateSlide = async () => {
    const title = createForm.title.trim();
    if (!title) {
      setError("新規スライドのタイトルを入力してください。");
      return;
    }
    if (!createForm.image) {
      setError("新規スライドの画像を選択してください。");
      return;
    }

    setCreating(true);
    clearMessages();

    try {
      const created = await apiClient.createAdminHomeHeroSlide({
        title,
        description: createForm.description.trim(),
        alt_text: createForm.alt_text.trim(),
        display_order: createForm.display_order,
        is_active: createForm.is_active,
        image: createForm.image,
      });

      setSlides((prev) => sortSlides([...prev, created]));
      setCreateForm(INITIAL_CREATE_FORM);
      setCreateImageInputKey((prev) => prev + 1);
      setSuccess("新規スライドを追加しました。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "新規追加に失敗しました。");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">トップ表示管理</h2>
        <p className="mt-1 text-sm text-slate-600">トップページの写真と文言を管理画面から変更できます。</p>
        {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
        {success ? <p className="mt-2 text-sm font-semibold text-emerald-700">{success}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">新規スライド追加</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            value={createForm.title}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="タイトル"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          />
          <input
            value={createForm.alt_text}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, alt_text: event.target.value }))}
            placeholder="代替テキスト（任意）"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
          />
          <textarea
            value={createForm.description}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="説明文（任意）"
            className="min-h-[76px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 md:col-span-2"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700">表示順</label>
            <input
              type="number"
              value={createForm.display_order}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, display_order: Number(event.target.value || "0") }))
              }
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={createForm.is_active}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, is_active: event.target.checked }))}
            />
            公開する
          </label>
          <div className="md:col-span-2">
            <input
              key={createImageInputKey}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, image: event.target.files?.[0] || null }))
              }
              className="block w-full text-sm text-slate-700"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleCreateSlide}
          disabled={creating}
          className="mt-4 rounded-lg bg-[#0b2d5f] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {creating ? "追加中..." : "スライドを追加"}
        </button>
      </section>

      <section className="space-y-3">
        {sortedSlides.map((slide) => (
          <article key={slide.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div>
                <img
                  src={resolveMediaUrl(slide.image_url || slide.image)}
                  alt={slide.alt_text || slide.title}
                  className="h-[130px] w-full rounded-lg border border-slate-200 object-cover"
                />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setReplaceImages((prev) => ({ ...prev, [slide.id]: event.target.files?.[0] || null }))
                  }
                  className="mt-2 block w-full text-xs text-slate-700"
                />
                {replaceImages[slide.id] ? (
                  <p className="mt-1 text-xs text-amber-700">差し替え画像: {replaceImages[slide.id]?.name}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <input
                  value={slide.title}
                  onChange={(event) => updateSlideField(slide.id, "title", event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
                />
                <textarea
                  value={slide.description}
                  onChange={(event) => updateSlideField(slide.id, "description", event.target.value)}
                  className="min-h-[70px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
                />
                <input
                  value={slide.alt_text}
                  onChange={(event) => updateSlideField(slide.id, "alt_text", event.target.value)}
                  placeholder="代替テキスト"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    表示順
                    <input
                      type="number"
                      value={slide.display_order}
                      onChange={(event) =>
                        updateSlideField(slide.id, "display_order", Number(event.target.value || "0"))
                      }
                      className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={slide.is_active}
                      onChange={(event) => updateSlideField(slide.id, "is_active", event.target.checked)}
                    />
                    公開する
                  </label>
                </div>

                <div className="mt-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveSlide(slide)}
                    disabled={savingId === slide.id}
                    className="rounded-lg bg-[#0b2d5f] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {savingId === slide.id ? "保存中..." : "保存"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlide(slide.id)}
                    disabled={deletingId === slide.id}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {deletingId === slide.id ? "削除中..." : "削除"}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
        {!sortedSlides.length ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            スライドが未登録です。上のフォームから追加してください。
          </p>
        ) : null}
      </section>
    </div>
  );
}
