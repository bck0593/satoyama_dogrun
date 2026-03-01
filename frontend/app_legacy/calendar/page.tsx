import BottomTabBar from "../components/bottom-tab-bar"
import EmptyState from "../components/empty-state"
import { Calendar } from "lucide-react"

export default function CalendarPage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-lg font-bold text-strong">カレンダー</h1>
      </div>

      <div className="px-4 py-8">
        <EmptyState
          icon={<Calendar className="w-12 h-12" />}
          title="カレンダー機能は準備中です"
          description="イベントのカレンダー表示機能を開発中です。しばらくお待ちください。"
        />
      </div>

      <BottomTabBar />
    </div>
  )
}
