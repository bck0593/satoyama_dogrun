import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { fetchProviders } from "@/src/lib/api"
import ProviderGrid from "../components/provider-grid"
import BottomTabBar from "../components/bottom-tab-bar"

export default async function ProvidersPage() {
  const providers = await fetchProviders()

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold text-strong">提供元一覧</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          今治の様々なコミュニティやイベントを提供している団体・組織の一覧です。
        </p>

        <ProviderGrid providers={providers} />
      </div>

      <BottomTabBar />
    </div>
  )
}
