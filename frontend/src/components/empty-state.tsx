import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Friendly empty state in the FC今治 style: a navy icon tile with a yellow
 * accent dot, a clear title, supporting copy, and an optional call to action
 * that tells the user what to do next.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-[#c5d6ec] bg-gradient-to-b from-white to-[#f5faff] px-5 py-9 text-center",
        className,
      )}
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf1fb] text-[#0a438d] shadow-[0_8px_18px_rgba(10,67,141,0.12)]">
        <Icon className="h-7 w-7" aria-hidden="true" />
        <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-[#ffd100] ring-2 ring-white" aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm font-black text-[#15396e]">{title}</p>
      {description ? <p className="mt-1.5 max-w-[19rem] text-xs leading-5 text-[#5d769b]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
