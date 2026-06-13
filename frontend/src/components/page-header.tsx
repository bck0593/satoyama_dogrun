import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function PageHeader({
  title,
  description,
  backHref,
}: {
  title: string;
  description?: string;
  backHref?: string;
}) {
  return (
    <div className="bg-gradient-to-br from-[#083a82] to-[#0b2f67] px-4 pb-6 pt-8 text-white">
      <div className="mb-3 flex items-center gap-2">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="戻る"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      {description ? <p className="text-sm text-blue-100">{description}</p> : null}
    </div>
  );
}
