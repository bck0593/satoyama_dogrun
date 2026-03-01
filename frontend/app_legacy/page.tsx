import Link from "next/link"
import CategoryIconGrid from "./components/category-icon-grid"
import ImageSlider from "./components/image-slider"
import BottomTabBar from "./components/bottom-tab-bar"

export default async function HomePage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-primary to-blue-700 text-white px-4 pt-12 pb-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-balance">Imabari Community Hub</h1>
          <p className="text-blue-100 text-sm leading-relaxed text-pretty">
            今治の様々なコミュニティやイベント情報を
            <br />
            一つの場所で見つけることができます
          </p>
        </div>
      </div>

      <div className="px-4 py-6">
        <ImageSlider />
      </div>

      <CategoryIconGrid />

      <div className="px-4 space-y-8">
        <footer className="text-center py-4">
          <Link href="/admin/login" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            管理者ログイン
          </Link>
        </footer>
      </div>

      <BottomTabBar />
    </div>
  )
}
