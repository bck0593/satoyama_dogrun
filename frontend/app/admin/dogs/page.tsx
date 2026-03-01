"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/src/lib/api";
import type { Dog, UserProfile } from "@/src/lib/types";

type Member = UserProfile & { dog_count: number };
type StatusFilter = "all" | "pending" | "approved" | "rejected";

const statusMeta: Record<Exclude<StatusFilter, "all">, { label: string; className: string }> = {
  pending: { label: "承認待ち", className: "bg-amber-100 text-amber-800" },
  approved: { label: "承認済み", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "差戻し", className: "bg-red-100 text-red-800" },
};

export default function AdminDogsPage() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [membersById, setMembersById] = useState<Record<number, Member>>({});
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [savingDogId, setSavingDogId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [dogsData, membersData] = await Promise.all([apiClient.getAdminDogs(), apiClient.getAdminMembers()]);
        setDogs(dogsData);
        setMembersById(Object.fromEntries(membersData.map((member) => [member.id, member])));
      } catch (err) {
        setError(err instanceof Error ? err.message : "犬データの取得に失敗しました。");
      }
    };
    load().catch(() => null);
  }, []);

  const filtered = useMemo(() => {
    let items = dogs;
    if (filter !== "all") {
      items = items.filter((dog) => dog.vaccine_approval_status === filter);
    }
    const keyword = search.trim().toLowerCase();
    if (keyword) {
      items = items.filter((dog) => {
        const owner = membersById[dog.owner];
        const haystacks = [dog.name, dog.breed, dog.breed_group || "", owner?.display_name || "", owner?.email || ""];
        return haystacks.some((value) => value.toLowerCase().includes(keyword));
      });
    }
    return [...items].sort((a, b) => {
      const statusOrder = { pending: 0, rejected: 1, approved: 2 };
      return statusOrder[a.vaccine_approval_status] - statusOrder[b.vaccine_approval_status];
    });
  }, [dogs, filter, search, membersById]);

  const pendingCount = useMemo(
    () => dogs.filter((dog) => dog.vaccine_approval_status === "pending").length,
    [dogs],
  );

  const submitReview = async (dog: Dog, status: "approved" | "rejected") => {
    setSavingDogId(dog.id);
    try {
      const updated = await apiClient.reviewAdminDogVaccine(dog.id, {
        vaccine_approval_status: status,
        vaccine_review_note: reviewNotes[dog.id] || "",
      });
      setDogs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "承認更新に失敗しました。");
    } finally {
      setSavingDogId(null);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">犬管理</h2>
        <p className="mt-1 text-sm text-slate-600">ワクチン証明をスタッフが確認し、承認後に利用可能になります。</p>
        <p className="mt-2 text-sm font-semibold text-amber-700">承認待ち: {pendingCount} 件</p>
        {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {(["pending", "approved", "rejected", "all"] as StatusFilter[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                filter === status ? "bg-[#0b2d5f] text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {status === "all" ? "すべて" : statusMeta[status].label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="犬名 / 犬種 / 飼い主名"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        />
      </section>

      <section className="space-y-3">
        {filtered.map((dog) => {
          const owner = membersById[dog.owner];
          return (
            <article key={dog.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {dog.name} <span className="text-slate-600">({dog.breed})</span>
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    飼い主: {owner?.display_name || `user#${dog.owner}`} / {dog.size_category} / {dog.weight_kg}kg
                  </p>
                  <p className="mt-1 text-sm text-slate-600">ワクチン期限: {dog.vaccine_expires_on}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    statusMeta[dog.vaccine_approval_status].className
                  }`}
                >
                  {statusMeta[dog.vaccine_approval_status].label}
                </span>
              </div>

              {dog.vaccine_proof_image ? (
                <a
                  href={dog.vaccine_proof_image}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-blue-700 underline"
                >
                  ワクチン証明画像を開く
                </a>
              ) : (
                <p className="mt-3 text-sm text-red-600">ワクチン証明画像なし</p>
              )}

              {dog.vaccine_review_note ? (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">メモ: {dog.vaccine_review_note}</p>
              ) : null}

              {dog.vaccine_approval_status === "pending" ? (
                <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label htmlFor={`review-note-${dog.id}`} className="text-xs font-semibold text-slate-600">
                    審査メモ（任意）
                  </label>
                  <textarea
                    id={`review-note-${dog.id}`}
                    value={reviewNotes[dog.id] ?? ""}
                    onChange={(event) => setReviewNotes((prev) => ({ ...prev, [dog.id]: event.target.value }))}
                    className="min-h-[70px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={savingDogId === dog.id}
                      onClick={() => submitReview(dog, "approved")}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      承認
                    </button>
                    <button
                      type="button"
                      disabled={savingDogId === dog.id}
                      onClick={() => submitReview(dog, "rejected")}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      差戻し
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
        {!filtered.length ? <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">対象データがありません。</p> : null}
      </section>
    </div>
  );
}
