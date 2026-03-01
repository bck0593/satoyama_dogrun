"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Dog,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  Shield,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/src/contexts/auth-context";

const navItems = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/admin/home-content", label: "トップ表示", icon: ImageIcon },
  { href: "/admin/members", label: "会員管理", icon: Users },
  { href: "/admin/dogs", label: "犬管理", icon: Dog },
  { href: "/admin/reservations", label: "予約管理", icon: CalendarDays },
  { href: "/admin/checkins", label: "入退場ログ", icon: ScanLine },
  { href: "/admin/sales", label: "売上", icon: CreditCard },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const activeTitle = useMemo(() => {
    return navItems.find((item) => isActive(pathname, item.href))?.label ?? "管理";
  }, [pathname]);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700"
          aria-label="メニュー"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <p className="text-sm font-bold text-slate-800">{activeTitle}</p>
        <div className="w-9" />
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] border-r border-slate-200 bg-[#0b2d5f] text-white transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-blue-900 px-5 py-5">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-[#ffd100]" />
              <div>
                <p className="text-xs tracking-[0.12em] text-blue-200">DOGRUN ADMIN</p>
                <h1 className="text-base font-bold">里山ドッグラン管理</h1>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active ? "bg-[#ffd100] text-[#102a56]" : "text-blue-100 hover:bg-blue-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 border-t border-blue-900 p-3">
            <p className="truncate px-2 text-xs text-blue-200">{user?.display_name || user?.username}</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500 px-3 py-2 text-sm font-medium text-blue-100 hover:bg-blue-900"
            >
              <ArrowLeft className="h-4 w-4" />
              ユーザー画面へ
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#0b2d5f]"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </button>
          </div>
        </div>
      </aside>

      {open ? <button type="button" className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} /> : null}
    </>
  );
}
