"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { MobilePage } from "@/src/components/mobile-page";
import { useAuth } from "@/src/contexts/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithLineMock } = useAuth();
  const [lineUserId, setLineUserId] = useState("line-demo-001");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace("/");
  }, [router, user]);

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
          </form>
        </section>
      </div>
    </MobilePage>
  );
}
