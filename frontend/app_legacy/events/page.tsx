import Image from "next/image"
import Link from "next/link"
import { CalendarDays, MapPin, ArrowRight } from "lucide-react"

import { fetchEvents } from "@/src/lib/api"
import EventCard from "../components/event-card"
import HomeBar from "../components/home-bar"
import BottomTabBar from "../components/bottom-tab-bar"
import TagBadge from "../components/tag-badge"

const FALLBACK_HERO = "/images/fc-imabari-community.jpg"

function formatDateRange(startAt: string, endAt: string) {
  const start = new Date(startAt)
  const end = new Date(endAt)

  const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  })

  const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  const startDate = dateFormatter.format(start)
  const endDate = dateFormatter.format(end)
  const startTime = timeFormatter.format(start)
  const endTime = timeFormatter.format(end)

  if (startDate === endDate) {
    return `${startDate} ${startTime}〜${endTime}`
  }

  return `${startDate} ${startTime} 〜 ${endDate} ${endTime}`
}

export default async function EventsPage() {
  const response = await fetchEvents({ page: 1, page_size: 20 })
  const events = [...response.items].sort(
    (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime(),
  )

  if (events.length === 0) {
    return (
      <div className="min-h-screen pb-20 bg-gray-50">
        <HomeBar title="イベント情報" showBack={false} />
        <div className="px-4 py-20 text-center text-gray-500 text-sm">
          現在公開中のイベント情報はありません。新しいお知らせをお待ちください。
        </div>
        <BottomTabBar />
      </div>
    )
  }

  const [featured, ...rest] = events
  const heroImage = featured.hero_image_url || FALLBACK_HERO

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <HomeBar title="イベント情報" showBack={false} />

      <section className="relative">
        <div className="relative h-[320px] md:h-[360px]">
          <Image src={heroImage} alt={featured.title} fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

          <div className="relative h-full flex flex-col justify-end px-4 py-8 text-white space-y-3">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-white/80">
              <CalendarDays className="w-4 h-4" />
              {formatDateRange(featured.start_at, featured.end_at)}
            </span>

            <h1 className="text-2xl font-bold leading-tight text-balance">{featured.title}</h1>

            {featured.summary && (
              <p className="text-sm text-white/80 leading-relaxed max-w-xl text-pretty">{featured.summary}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
              {featured.venue?.name && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {featured.venue.name}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {featured.tags.slice(0, 4).map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  size="sm"
                  variant="outline"
                  className="bg-white/15 border-white/40 text-white"
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`/events/${featured.slug}`}
                className="inline-flex items-center gap-2 bg-white text-brand-primary font-semibold px-4 py-2 rounded-full shadow-sm hover:bg-blue-50 transition"
              >
                詳細を見る
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/events/${featured.slug}#apply`}
                className="inline-flex items-center gap-2 text-sm font-medium text-white/90 border border-white/50 px-4 py-2 rounded-full hover:bg-white/20 transition"
              >
                申込みフォームへ
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900">
            <CalendarDays className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-semibold">最新イベント</h2>
          </div>
          <span className="text-xs text-gray-500">{events.length}件を掲載中</span>
        </header>

        <div className="space-y-4">
          <EventCard key={featured.id} event={featured} className="border border-brand-primary/40" />
          {rest.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      <section className="px-4 pb-10">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
          <h3 className="font-semibold text-gray-900">アプリからの申込みについて</h3>
          <p className="text-sm text-gray-600 leading-relaxed text-pretty">
            各イベントページ下部にある「申込みフォームを開く」ボタンから、ログインした状態で申し込みが可能です。
            参加希望のプログラムや同行者情報など、必要事項をご入力のうえ送信してください。
          </p>
          <p className="text-xs text-gray-400">※お申込み内容は事務局で確認後、メールにて詳細をご案内します。</p>
        </div>
      </section>

      <BottomTabBar />
    </div>
  )
}
