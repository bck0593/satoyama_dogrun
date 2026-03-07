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
              表示名
              <input
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="山田 太郎"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              メール
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="demo@example.com"
              />
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#06c755] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "ログイン中..." : "LINEでログイン"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => loginAsDummyAdmin().catch(() => null)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              ダミー管理者でログイン
            </button>
            <p className="text-xs text-slate-500">seed 済みの「運営管理者」で管理画面に入れます。</p>
          </form>
        </section>
      </div>
    </MobilePage>
  );
}
