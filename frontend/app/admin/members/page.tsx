"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/src/lib/api";
import type { UserProfile } from "@/src/lib/types";

type Member = UserProfile & { dog_count: number };

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ja-JP");
}

function isSuspended(value: string | null) {
  if (!value) return false;
  const suspendedUntil = new Date(value);
  return !Number.isNaN(suspendedUntil.getTime()) && suspendedUntil.getTime() > Date.now();
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await apiClient.getAdminMembers();
        setMembers(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "会員情報の取得に失敗しました。");
      }
    };
    load().catch(() => null);
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return members;
    return members.filter((member) => {
      const haystacks = [
        member.display_name,
        member.username,
        member.email,
        member.phone_number,
        member.line_user_id,
      ];
      return haystacks.some((item) => item?.toLowerCase().includes(keyword));
    });
  }, [members, search]);

  const summary = useMemo(
    () => ({
      total: filtered.length,
      withDogs: filtered.filter((member) => member.dog_count > 0).length,
      suspended: filtered.filter((member) => isSuspended(member.suspended_until)).length,
      staff: filtered.filter((member) => member.is_staff).length,
    }),
    [filtered],
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">会員管理</h2>
        <p className="mt-1 text-sm text-slate-600">
          会員の連絡先、LINE ID、登録犬数、no-show 状況、利用停止状況を確認できます。
        </p>
        {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="member-search" className="mb-2 block text-sm font-semibold text-slate-700">
          会員検索
        </label>
        <input
          id="member-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="名前 / メール / 電話番号 / LINE ID"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">会員数</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{summary.total}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">犬登録済み</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{summary.withDogs}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">利用停止中</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{summary.suspended}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">運営者</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{summary.staff}</p>
        </article>
      </section>

      <section className="grid gap-3 md:hidden">
        {filtered.map((member) => (
          <article key={member.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold text-slate-900">{member.display_name || member.username}</p>
                <p className="text-xs text-slate-500">@{member.username}</p>
              </div>
              {member.is_staff ? (
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">運営者</span>
              ) : null}
            </div>
            <dl className="mt-3 space-y-2 text-sm text-slate-700">
              <div>
                <dt className="text-xs font-semibold text-slate-500">メール</dt>
                <dd>{member.email || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">電話番号</dt>
                <dd>{member.phone_number || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">LINE ID</dt>
                <dd>{member.line_user_id || "-"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-xs font-semibold text-slate-500">登録犬数</dt>
                  <dd>{member.dog_count}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">no-show</dt>
                  <dd>{member.no_show_count}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">利用停止</dt>
                <dd>{member.suspended_until ? formatDate(member.suspended_until) : "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">登録日</dt>
                <dd>{formatDate(member.created_at)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <section className="hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm md:block md:p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700">
                <th className="px-3 py-2">会員</th>
                <th className="px-3 py-2">連絡先</th>
                <th className="px-3 py-2">LINE / ユーザー名</th>
                <th className="px-3 py-2">登録犬数</th>
                <th className="px-3 py-2">no-show</th>
                <th className="px-3 py-2">利用停止</th>
                <th className="px-3 py-2">登録日</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-900">{member.display_name || member.username}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {member.is_staff ? (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">運営者</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    <p>{member.email || "-"}</p>
                    <p className="mt-1 text-xs text-slate-500">{member.phone_number || "電話番号未登録"}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    <p>{member.line_user_id || "-"}</p>
                    <p className="mt-1 text-xs text-slate-500">@{member.username}</p>
                  </td>
                  <td className="px-3 py-3">{member.dog_count}</td>
                  <td className="px-3 py-3">{member.no_show_count}</td>
                  <td className="px-3 py-3">
                    {member.suspended_until ? (
                      <span className={isSuspended(member.suspended_until) ? "font-semibold text-red-600" : "text-slate-700"}>
                        {formatDate(member.suspended_until)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-3">{formatDate(member.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length ? <p className="px-3 py-4 text-sm text-slate-500">該当する会員がいません。</p> : null}
      </section>
    </div>
  );
}
