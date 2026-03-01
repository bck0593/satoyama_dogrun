import Image from "next/image"
import { ExternalLink, MapPin, Clock, FileText } from "lucide-react"
import { notFound } from "next/navigation"
import { fetchEvent } from "@/src/lib/api"
import TagBadge from "../../components/tag-badge"
import VenuePill from "../../components/venue-pill"
import ApplyButton from "../../components/apply-button"
import HomeBar from "../../components/home-bar"
import { formatDetailDate, formatDetailTime } from "../../lib/date-utils"

interface EventDetailPageProps {
  params: { slug: string }
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  let event

  try {
    event = await fetchEvent(params.slug)
  } catch (error) {
    notFound()
  }

  const startDate = new Date(event.start_at)
  const endDate = new Date(event.end_at)
  const isSameDay = startDate.toDateString() === endDate.toDateString()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <HomeBar title="イベント詳細" />

      {/* Hero Image */}
      {event.hero_image_url && (
        <div className="relative h-64 w-full">
          <Image
            src={event.hero_image_url || "/placeholder.svg"}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="px-4 py-6 space-y-6">
        {/* Title and Basic Info */}
        <div>
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-2xl font-bold text-strong leading-tight flex-1 mr-4 text-balance">{event.title}</h1>
            {event.venue && <VenuePill venue={event.venue} />}
          </div>

          {event.summary && <p className="text-gray-600 leading-relaxed mb-4">{event.summary}</p>}

          {/* Category */}
          {event.category && (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {event.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-lg text-strong">開催情報</h2>

          {/* Date and Time */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">{formatDetailDate(event.start_at)}</div>
              <div className="text-sm text-gray-600">
                {isSameDay
                  ? `${formatDetailTime(event.start_at)} - ${formatDetailTime(event.end_at)}`
                  : `${formatDetailTime(event.start_at)} - ${formatDetailDate(event.end_at)} ${formatDetailTime(event.end_at)}`}
              </div>
            </div>
          </div>

          {/* Venue */}
          {event.venue && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">{event.venue.name}</div>
                {event.venue.address && <div className="text-sm text-gray-600">{event.venue.address}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {event.tags.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">タグ</h3>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          </div>
        )}

        {/* Event Description */}
        {event.body_md && (
          <div>
            <h2 className="font-bold text-lg text-strong mb-4">詳細</h2>
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              {event.body_md.split("\n").map((line, index) => {
                if (line.startsWith("# ")) {
                  return (
                    <h3 key={index} className="text-lg font-bold text-strong mt-6 mb-3 first:mt-0">
                      {line.replace("# ", "")}
                    </h3>
                  )
                }
                if (line.startsWith("## ")) {
                  return (
                    <h4 key={index} className="text-base font-semibold text-strong mt-4 mb-2">
                      {line.replace("## ", "")}
                    </h4>
                  )
                }
                if (line.startsWith("### ")) {
                  return (
                    <h5 key={index} className="text-sm font-semibold text-strong mt-3 mb-2">
                      {line.replace("### ", "")}
                    </h5>
                  )
                }
                if (line.startsWith("- ")) {
                  return (
                    <div key={index} className="flex items-start gap-2 mb-1">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{line.replace("- ", "")}</span>
                    </div>
                  )
                }
                if (line.trim() === "") {
                  return <div key={index} className="h-3" />
                }
                return (
                  <p key={index} className="mb-3">
                    {line}
                  </p>
                )
              })}
            </div>
          </div>
        )}

        {/* Application Section */}
        <div className="bg-white border-2 border-brand-primary rounded-2xl p-5">
          <h2 className="font-bold text-lg text-strong mb-4">参加申込み</h2>

          {event.application_type === "external_link" && (
            <div className="space-y-3">
              <p className="text-gray-600 text-sm">外部サイトで申込み手続きを行います。</p>
              <a
                href={event.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                申込みサイトへ
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {event.application_type === "internal_form" && (
            <div className="space-y-3">
              <p className="text-gray-600 text-sm">
                アプリ内で申込み手続きができます。Googleアカウントでのログインが必要です。
              </p>
              <ApplyButton event={event} />
            </div>
          )}

          {event.application_type === "offline" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">紙での申込みが必要です</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    下記の場所で申込用紙を入手し、必要事項をご記入の上、提出してください。
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-2">申込用紙配布・受付場所</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• 今治市役所 1階受付</li>
                  <li>• 今治里山公園管理事務所</li>
                  <li>• FC今治クラブハウス</li>
                </ul>
              </div>

              {event.venue && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">会場案内</h4>
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">{event.venue.name}</div>
                    {event.venue.address && <div>{event.venue.address}</div>}
                  </div>
                  {/* Placeholder for map */}
                  <div className="mt-3 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-sm">地図（準備中）</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
