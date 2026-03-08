"use client";

import { cn } from "@/lib/utils";

const toneClassName = {
  brand: "border-[#bfd4f2] bg-[#eef5ff] text-[#0b428d]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
} as const;

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneClassName;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        toneClassName[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
