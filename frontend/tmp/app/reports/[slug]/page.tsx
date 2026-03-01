import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react"
import { notFound } from "next/navigation"
import { fetchReport, fetchEvent } from "@/src/lib/api"
import TagBadge from "../../components/tag-badge"
import HomeBar from "../../components/home-bar"
import { formatReportDate } from "../../lib/date-utils"

interface ReportDetailPageProps {
  params: { slug: string }
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  let report
  let relatedEvent = null

  try {
    report = await fetchReport(params.slug)

    // Fetch related event if exists
    if (report.event_slug) {
      try {
        relatedEvent = await fetchEvent(report.event_slug)
      } catch (error) {
        // Related event not found, continue without it
        console.warn("Related event not found:", report.event_slug)
      }
    }
  } catch (error) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <HomeBar title="レポート" />

      {/* Hero Image */}
      {report.hero_image_url && (
        <div className="relative h-64 w-full">
          <Image
            src={report.hero_image_url || "/placeholder.svg"}
            alt={report.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="px-4 py-6 space-y-6">
        {/* Title and Meta */}
        <div>
          <h1 className="text-2xl font-bold text-strong leading-tight mb-3 text-balance">{report.title}</h1>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Calendar className="w-4 h-4" />
            <span>{formatReportDate(report.published_at)}</span>
          </div>

          {/* Tags */}
          {report.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {report.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
            </div>
          )}
        </div>

        {/* Related Event */}
        {relatedEvent && (
          <div className="bg-blue-50 rounded-2xl p-5">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              関連イベント
            </h3>
            <Link
              href={`/events/${relatedEvent.slug}`}
              className="block hover:bg-blue-100 rounded-lg p-3 -m-3 transition-colors"
            >
              <div className="font-medium text-blue-800">{relatedEvent.title}</div>
              <div className="text-sm text-blue-600 mt-1">
                {new Date(relatedEvent.start_at).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </Link>
          </div>
        )}

        {/* Report Content */}
        <div className="prose prose-sm max-w-none">
          <div className="text-gray-700 leading-relaxed space-y-4">
            {report.body_md.split("\n").map((line, index) => {
              if (line.startsWith("# ")) {
                return (
                  <h2 key={index} className="text-xl font-bold text-strong mt-8 mb-4 first:mt-0">
                    {line.replace("# ", "")}
                  </h2>
                )
              }
              if (line.startsWith("## ")) {
                return (
                  <h3 key={index} className="text-lg font-bold text-strong mt-6 mb-3">
                    {line.replace("## ", "")}
                  </h3>
                )
              }
              if (line.startsWith("### ")) {
                return (
                  <h4 key={index} className="text-base font-semibold text-strong mt-4 mb-2">
                    {line.replace("### ", "")}
                  </h4>
                )
              }
              if (line.startsWith("#### ")) {
                return (
                  <h5 key={index} className="text-sm font-semibold text-strong mt-3 mb-2">
                    {line.replace("#### ", "")}
                  </h5>
                )
              }
              if (line.startsWith("- ")) {
                return (
                  <div key={index} className="flex items-start gap-2 mb-2">
                    <span className="text-brand-primary mt-1.5 text-xs">●</span>
                    <span>{line.replace("- ", "")}</span>
                  </div>
                )
              }
              if (line.startsWith("**") && line.endsWith("**")) {
                return (
                  <div key={index} className="font-semibold text-gray-900 mt-4 mb-2">
                    {line.replace(/\*\*/g, "")}
                  </div>
                )
              }
              if (line.trim() === "") {
                return <div key={index} className="h-4" />
              }
              return (
                <p key={index} className="mb-4 leading-relaxed">
                  {line}
                </p>
              )
            })}
          </div>
        </div>

        {/* Related Reports */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-bold text-lg text-strong mb-4">その他のレポート</h3>
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">他のレポートも準備中です</p>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1 text-brand-primary hover:text-blue-700 transition-colors mt-2 text-sm"
            >
              レポート一覧へ
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
