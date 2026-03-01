import Link from "next/link"
import { FileText } from "lucide-react"

import { fetchReports } from "@/src/lib/api"

import BottomTabBar from "../components/bottom-tab-bar"
import EmptyState from "../components/empty-state"
import HomeBar from "../components/home-bar"
import ReportCard from "../components/report-card"
import TagBadge from "../components/tag-badge"

const reportTags = [
  { id: "tag-art", name: "アート", slug: "art" },
  { id: "tag-workshop", name: "ワークショップ", slug: "workshop" },
  { id: "tag-community", name: "コミュニティ", slug: "community" },
  { id: "tag-stadium", name: "スタジアム", slug: "stadium" },
  { id: "tag-volunteer", name: "ボランティア", slug: "volunteer" },
  { id: "tag-agriculture", name: "農業", slug: "agriculture" },
  { id: "tag-kids", name: "キッズ", slug: "kids" },
  { id: "tag-sports", name: "スポーツ", slug: "sports" },
  { id: "tag-running", name: "ランニング", slug: "running" },
  { id: "tag-training", name: "トレーニング", slug: "training" },
]

interface ReportsPageProps {
  searchParams: { tags?: string }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const selectedTags = searchParams.tags?.split(",").filter(Boolean) || []

  const reportsResponse = await fetchReports({
    page: 1,
    page_size: 20,
    tags: selectedTags,
  })

  const reports = reportsResponse.items

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <HomeBar title="レポート" />

      <section className="bg-white border-b border-gray-200 px-4 py-4 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">トピックで絞り込む</h2>
          <p className="text-xs text-gray-500">最新の取り組みやイベント後記をタグから素早くチェックできます。</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/reports">
            <TagBadge
              tag={{ id: "all", name: "すべて", slug: "all" }}
              size="sm"
              variant={selectedTags.length === 0 ? "default" : "outline"}
              className="hover:bg-gray-50 transition-colors"
            />
          </Link>

          {reportTags.map((tag) => {
            const isActive = selectedTags.includes(tag.slug)
            const nextTags = isActive
              ? selectedTags.filter((slug) => slug !== tag.slug)
              : [...selectedTags, tag.slug]
            const href = nextTags.length > 0 ? `/reports?tags=${nextTags.join(",")}` : "/reports"

            return (
              <Link key={tag.id} href={href}>
                <TagBadge
                  tag={tag}
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  className="hover:bg-gray-50 transition-colors"
                />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="px-4 py-6">
        {reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="該当するレポートが見つかりませんでした"
            description={
              selectedTags.length > 0
                ? "選択中のタグに該当するレポートは現在公開されていません。別のタグをお試しください。"
                : "まだレポートが登録されていません。更新まで少しお待ちください。"
            }
            action={
              selectedTags.length > 0 ? (
                <Link href="/reports">
                  <TagBadge
                    tag={{ id: "all", name: "すべてのレポートを見る", slug: "all" }}
                    size="sm"
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-50"
                  />
                </Link>
              ) : undefined
            }
          />
        )}
      </section>

      <BottomTabBar />
    </div>
  )
}
