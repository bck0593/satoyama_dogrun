import BottomTabBar from "../components/bottom-tab-bar"
import EmptyState from "../components/empty-state"
import { Bell } from "lucide-react"

export default function NotificationsPage() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-lg font-bold text-strong">通知</h1>
      </div>

      <div className="px-4 py-8">
        <EmptyState
          icon={<Bell className="w-12 h-12" />}
          title="通知はありません"
          description="新しいイベントやお知らせがあるとここに表示されます。"
        />
      </div>

      <BottomTabBar />
    </div>
  )
}
