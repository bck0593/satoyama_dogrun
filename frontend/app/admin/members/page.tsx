"use client";

import { useEffect, useMemo, useState } from "react";

import { apiClient } from "@/src/lib/api";
import type { UserProfile } from "@/src/lib/types";

type Member = UserProfile & { dog_count: number };

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ja-JP");
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
        setError(err instanceof Error ? err.message : "会員一覧の取得に失敗しました。");
      }
    };
    load().catch(() => null);
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return members;
    return members.filter((member) => {
      const haystacks = [member.display_name, member.username, member.email, member.line_user_id];
      return haystacks.some((item) => item?.toLowerCase().includes(keyword));
    });
  }, [members, search]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">会員管理</h2>
        <p className="mt-1 text-sm text-slate-600">会員情報、犬登録数、利用停止状態を確認できます。</p>
        {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="member-search" className="mb-2 block text-sm font-semibold text-slate-700">
          検索
        </label>
        <input
          id="member-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="名前 / メール / LINE ID"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700">
                <th className="px-3 py-2">会員</th>
                <th className="px-3 py-2">犬数</th>
                <th className="px-3 py-2">ランク</th>
                <th className="px-3 py-2">no-show</th>
                <th className="px-3 py-2">停止期限</th>
                <th className="px-3 py-2">登録日</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-slate-900">{member.display_name || member.username}</p>
                    <p className="text-xs text-slate-500">{member.email || "-"}</p>
                  </td>
                  <td className="px-3 py-2">{member.dog_count}</td>
                  <td className="px-3 py-2">{member.membership_tier}</td>
                  <td className="px-3 py-2">{member.no_show_count}</td>
                  <td className="px-3 py-2">{formatDate(member.suspended_until)}</td>
                  <td className="px-3 py-2">{formatDate(member.created_at)}</td>
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
