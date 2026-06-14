import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Unified section heading for the FC今治 design system: a yellow accent bar,
 * an optional navy icon chip, a bold navy title, and an optional right-aligned
 * action. Replaces the previously ad-hoc, multi-colored section headers.
 */
export function SectionHeading({
  icon: Icon,
  title,
  eyebrow,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
        <h2 className="flex items-center gap-2 text-base font-black tracking-tight text-[#13386e]">
          <span className="accent-bar" aria-hidden="true" />
          {Icon ? (
            <span className="heading-icon">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          ) : null}
          <span className="truncate">{title}</span>
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
