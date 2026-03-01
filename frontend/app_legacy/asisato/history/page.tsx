"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const participationHistory = [
  {
    id: 1,
    eventName: "アシさと交流会 vol.12",
    date: "2024年3月15日",
    points: 10,
    status: "参加済み",
  },
  {
    id: 2,
    eventName: "春の清掃活動",
    date: "2024年3月8日",
    points: 15,
    status: "参加済み",
  },
  {
    id: 3,
    eventName: "アシさと勉強会",
    date: "2024年2月28日",
    points: 5,
    status: "参加済み",
  },
]

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link href="/asisato/membership" className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">参加履歴</h1>
      </div>

      <div className="px-4 py-6">
        <div className="space-y-4">
          {participationHistory.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{item.eventName}</h3>
                <span className="text-sm text-green-600 font-medium">+{item.points}pt</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{item.date}</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">{item.status}</span>
              </div>
            </div>
          ))}
        </div>

        {participationHistory.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">📋</div>
            <p className="text-gray-500">まだ参加履歴がありません</p>
          </div>
        )}
      </div>
    </div>
  )
}
