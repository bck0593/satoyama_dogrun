"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/src/contexts/auth-context";

const links = [
  { href: "/", label: "ホーム" },
  { href: "/dogs", label: "犬登録" },
  { href: "/reservations", label: "予約" },
  { href: "/checkin", label: "QRチェックイン" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <header className="section-card mb-5 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-500">FC IMABARI DOGRUN OPS</p>
          <h1 className="text-xl font-bold text-slate-900">里山ドッグラン運営</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800">{user.display_name}</span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="rounded-full border border-slate-300 px-3 py-1 font-medium text-slate-700 hover:bg-slate-50"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded-full bg-slate-900 px-3 py-1 font-medium text-white">
              LINEログイン
            </Link>
          )}
        </div>
      </div>
      <nav className="flex flex-wrap gap-2">
        {[...links, ...(user?.is_staff ? [{ href: "/admin", label: "管理" }] : [])].map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
