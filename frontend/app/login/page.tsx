"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { MobilePage } from "@/src/components/mobile-page";
import { useAuth } from "@/src/contexts/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithLineMock, logout } = useAuth();
  const [lineUserId, setLineUserId] = useState("line-demo-001");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isNewUser = await loginWithLineMock({
        lineUserId,
        displayName: displayName || "LINE User",
        email,
      });
      router.replace(isNewUser ? "/mypage?setup=1" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const loginAsDummyAdmin = async () => {
    setLoading(true);
    setError(null);

    try {
      await loginWithLineMock({
        lineUserId: "dummy-line-admin",
        displayName: "運営管理者",
        email: "dummy.admin@example.com",
      });
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "管理者ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobilePage withTabs={false}>
      <div className="bg-gradient-to-br from-[#06c755] to-[#00a63c] px-4 pb-10 pt-16 text-white">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
          <MessageCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold">LINEログイン</h1>
        <p className="mt-2 text-center text-sm text-green-100">初回のみプロフィール登録を行います</p>
      </div>

      <div className="px-4 py-6">
        <section className="section-card">
          {user ? (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-900">現在ログイン中です</p>
              <p className="mt-1 text-sm text-emerald-800">
                {user.display_name || user.username}
                {user.is_staff ? " / 管理者" : ""}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href={user.is_staff ? "/admin" : "/"}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  {user.is_staff ? "管理画面へ移動" : "ホームへ戻る"}
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full rounded-xl border border-emerald-300 px-4 py-3 text-sm font-semibold text-emerald-900"
                >
                  ログアウトして別ユーザーでログイン
                </button>
              </div>
            </div>
          ) : null}

          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <p className="font-bold">これはデモ用のモック認証画面です</p>
            <p className="mt-1">本番では LINE LIFF ログインに置き換わります。任意の LINE User ID を入力してログインできます。</p>
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
            <label className="block text-sm font-medium text-gray-700">
              LINE User ID
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
                value={lineUserId}
                onChange={(event) => setLineUserId(event.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              表示名（任意）
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="山田 太郎"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              メール（任意）
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="demo@example.com"
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#06c755] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "ログイン中..." : "LINEでログイン（デモ）"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-slate-400">または</span></div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => loginAsDummyAdmin().catch(() => null)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              管理者デモアカウントでログイン
            </button>
            <p className="text-center text-xs text-slate-400">seed 済みの「運営管理者」アカウントで管理画面に入れます</p>
          </form>
        </section>
      </div>
    </MobilePage>
  );
}
