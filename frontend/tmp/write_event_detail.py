from pathlib import Path
content = r"""import Image from \"next/image\"
import Link from \"next/link\"
import { ArrowLeft, Calendar, ExternalLink, MapPin } from \"lucide-react\"
import { notFound } from \"next/navigation\"
import { fetchEvent } from \"@/src/lib/api\"
import TagBadge from \"../../components/tag-badge\"
import HomeBar from \"../../components/home-bar\"
import { formatDetailDate, formatDetailTime } from \"../../lib/date-utils\"
import ApplyButton from \"../../components/apply-button\"

interface EventDetailPageProps {
  params: { slug: string }
}

const FALLBACK_HERO = \"/images/fc-imabari-community.jpg\"

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
  const heroImage = event.hero_image_url ?? FALLBACK_HERO

  return (
    <div className=\"min-h-screen bg-white\">
      <HomeBar title=\"イベント詳細\" />

      <div className=\"relative h-64 w-full\">
        <Image src={heroImage} alt={event.title} fill className=\"object-cover\" priority />
        <div className=\"absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent\" />
      </div>

      <div className=\"px-4 py-6 space-y-6\">
        <div>
          <div className=\"flex items-start justify-between gap-3 mb-3\">
            <h1 className=\"text-2xl font-bold text-strong leading-tight flex-1 text-balance\">{event.title}</h1>
            <Link href=\"/events\" className=\"flex items-center gap-1 text-sm text-brand-primary hover:text-blue-700 transition\">
              <ArrowLeft className=\"w-4 h-4 rotate-180\" />
              一覧に戻る
            </Link>
          </div>

          <div className=\"flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3\">
            <span className=\"inline-flex items-center gap-1\">
              <Calendar className=\"w-4 h-4\" />
              {formatDetailDate(event.start_at)}
            </span>
            <span>
              {isSameDay
                ? ${formatDetailTime(event.start_at)}〜
                : ${formatDetailTime(event.start_at)} 〜  }
            </span>
            {event.venue?.name && (
              <span className=\"inline-flex items-center gap-1 text-gray-500\">
                <MapPin className=\"w-4 h-4\" />
                {event.venue.name}
              </span>
            )}
          </div>

          {event.summary && <p className=\"text-gray-600 leading-relaxed mb-4 text-pretty\">{event.summary}</p>}

          {event.tags.length > 0 && (
            <div className=\"flex flex-wrap gap-2\">
              {event.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} size=\"sm\" />
              ))}
            </div>
          )}
        </div>

        {event.venue && (
          <div className=\"bg-gray-50 rounded-2xl p-5 space-y-2\">
            <h2 className=\"font-semibold text-gray-900\">開催場所</h2>
            <p className=\"text-sm text-gray-700 leading-relaxed\">
              {event.venue.name}
              {event.venue.address ? （） : \"\"}
            </p>
          </div>
        )}

        {event.body_md && (
          <div className=\"prose prose-sm max-w-none\">
            <div className=\"text-gray-700 leading-relaxed space-y-4\">
              {event.body_md.split(\"\\n\").map((line, index) => {
                const trimmed = line.trim()

                if (trimmed.startsWith(\"# \\")) {
                  return (
                    <h2 key={index} className=\"text-xl font-bold text-strong mt-8 mb-4 first:mt-0\">
                      {trimmed.replace(\"# \", \"\")}
                    </h2>
                  )
                }
                if (trimmed.startsWith(\"## \\")) {
                  return (
                    <h3 key={index} className=\"text-lg font-bold text-strong mt-6 mb-3\">
                      {trimmed.replace(\"## \", \"\")}
                    </h3>
                  )
                }
                if (trimmed.startsWith(\"### \\")) {
                  return (
                    <h4 key={index} className=\"text-base font-semibold text-strong mt-4 mb-2\">
                      {trimmed.replace(\"### \", \"\")}
                    </h4>
                  )
                }
                if (trimmed.startsWith(\"#### \\")) {
                  return (
                    <h5 key={index} className=\"text-sm font-semibold text-strong mt-3 mb-2\">
                      {trimmed.replace(\"#### \", \"\")}
                    </h5>
                  )
                }
                if (trimmed.startsWith(\"- \") || trimmed.startsWith(\"• \") ) {
                  return (
                    <div key={index} className=\"flex items-start gap-2 mb-2\">
                      <span className=\"text-brand-primary mt-1.5 text-xs\">●</span>
                      <span>{trimmed.replace(/^[-•]\\s/, \"\")}</span>
                    </div>
                  )
                }
                if (trimmed === \"\") {
                  return <div key={index} className=\"h-4\" />
                }
                return (
                  <p key={index} className=\"mb-4 leading-relaxed\">
                    {trimmed}
                  </p>
                )
              })}
            </div>
          </div>
        )}

        <div id=\"apply\" className=\"bg-white border-2 border-brand-primary rounded-2xl p-5 space-y-4\">
          <h2 className=\"font-bold text-lg text-strong\">参加申込み</h2>

          {event.application_type === \"external_link\" && event.application_url && (
            <div className=\"space-y-3\">
              <p className=\"text-gray-600 text-sm\">外部サイトに移動して申込み手続きを行います。</p>
              <a
                href={event.application_url}
                target=\"_blank\"
                rel=\"noopener noreferrer\"
                className=\"inline-flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition\"
              >
                申込みサイトへ
                <ExternalLink className=\"w-4 h-4\" />
              </a>
            </div>
          )}

          {event.application_type === \"internal_form\" && (
            <div className=\"space-y-3\">
              <p className=\"text-gray-600 text-sm leading-relaxed\">
                アプリ内のフォームから申込みが可能です。参加希望内容と必要事項をご入力のうえ送信してください。
              </p>
              <ApplyButton event={event} />
            </div>
          )}

          {event.application_type === \"offline\" && (
            <div className=\"space-y-3\">
              <p className=\"text-gray-600 text-sm leading-relaxed\">
                紙の申込用紙での手続きが必要です。配布場所や受付方法については以下をご確認ください。
              </p>
            </div>
          )}
        </div>

        <div className=\"border-t border-gray-200 pt-6\">
          <h3 className=\"font-bold text-lg text-strong mb-4\">その他のイベント</h3>
          <div className=\"text-center py-6 text-gray-500\">
            <p className=\"text-sm\">気になるイベントをもっと見る</p>
            <Link
              href=\"/events\"
              className=\"inline-flex items-center gap-1 text-brand-primary hover:text-blue-700 transition-colors mt-2 text-sm\"
            >
              イベント一覧へ
              <ArrowLeft className=\"w-4 h-4 rotate-180\" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
"""
Path('app/events/[slug]/page.tsx').write_text(content, encoding='utf-8')
print('Updated event detail page')
