import { cn } from "@/lib/utils";

/** Single shimmering block. Compose these into page-specific skeletons. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

/** Accessible wrapper that announces a loading region to assistive tech. */
export function SkeletonRegion({ label = "読み込み中", children }: { label?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      {children}
    </div>
  );
}

/** Matches the two-up stat cards on the live-status screen. */
export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1].map((i) => (
        <div key={i} className="section-card">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="mx-auto mt-3 h-9 w-16" />
          <SkeletonBlock className="mx-auto mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Large hero/summary card skeleton (live-status occupancy panel, etc.). */
export function HeroCardSkeleton() {
  return (
    <div className="brand-card p-5">
      <div className="flex gap-2">
        <SkeletonBlock className="h-6 w-24 rounded-full" />
        <SkeletonBlock className="h-6 w-28 rounded-full" />
      </div>
      <SkeletonBlock className="mt-4 h-7 w-3/4" />
      <SkeletonBlock className="mt-3 h-3 w-2/3" />
      <SkeletonBlock className="mt-4 h-3 w-full rounded-full" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SkeletonBlock className="h-11 w-full rounded-xl" />
        <SkeletonBlock className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

/** Grid of time-slot button placeholders for the reservation screen. */
export function SlotGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} className="h-[68px] w-full rounded-2xl" />
      ))}
    </div>
  );
}

/** Stacked rows for list-style content (dogs, reservations, payments). */
export function ListSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[#e3ebf6] bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SkeletonBlock className="h-4 w-1/3" />
              <SkeletonBlock className="mt-2 h-3 w-2/3" />
            </div>
            <SkeletonBlock className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
