import Image from "next/image"
import Link from "next/link"
import type { Report } from "@/src/types"
import TagBadge from "./tag-badge"
import { formatReportDate } from "@/app/lib/date-utils"

interface ReportCardProps {
  report: Report
  className?: string
}

export default function ReportCard({ report, className = "" }: ReportCardProps) {
  return (
    <Link href={`/reports/${report.slug}`}>
      <div
        className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 ${className}`}
      >
        {report.hero_image_url && (
          <div className="relative h-40 w-full">
            <Image src={report.hero_image_url || "/placeholder.svg"} alt={report.title} fill className="object-cover" />
          </div>
        )}

        <div className="p-4">
          <h3 className="font-bold text-lg text-strong leading-tight mb-2">{report.title}</h3>

          <div className="text-sm text-gray-500 mb-3">{formatReportDate(report.published_at)}</div>

          {report.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {report.tags.slice(0, 3).map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
              {report.tags.length > 3 && (
                <span className="text-xs text-gray-400 px-2 py-1">+{report.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
