"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, QrCode, Radio, UserCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", icon: Home, label: "ホーム" },
  { href: "/reservation", icon: CalendarDays, label: "予約" },
  { href: "/checkin", icon: QrCode, label: "入退場" },
  { href: "/live-status", icon: Radio, label: "利用状況" },
  { href: "/mypage", icon: UserCircle2, label: "マイ" },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 pb-[calc(env(safe-area-inset-bottom)+0.3rem)]">
      <div className="mx-2 rounded-2xl border border-[#0f4b99] bg-gradient-to-b from-[#0a4598] to-[#083a82] shadow-[0_-10px_24px_rgba(8,38,83,0.38)]">
        <div className="grid grid-cols-5 gap-0.5 p-1.5">
          {tabs.map(({ href, icon: Icon, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-all",
                  isActive ? "bg-white/18 text-white" : "text-[#c6d8f2] hover:text-white",
                )}
              >
                <Icon className={cn("mb-0.5 h-4 w-4", isActive ? "scale-105" : "opacity-95")} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
