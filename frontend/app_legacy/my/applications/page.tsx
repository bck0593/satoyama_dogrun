"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Calendar, MapPin, Users, Dog } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import BottomTabBar from "../../components/bottom-tab-bar"

type Application = {
  id: string
  type: "event" | "dogrun"
  title: string
  date: string
  time?: string
  status: "pending" | "confirmed" | "cancelled"
  details: {
    people?: number
    dogs?: number
    location?: string
  }
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("user_applications")
    if (stored) {
      setApplications(JSON.parse(stored))
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-600 bg-green-50"
      case "cancelled":
        return "text-red-600 bg-red-50"
      default:
        return "text-yellow-600 bg-yellow-50"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "確定"
      case "cancelled":
        return "キャンセル"
      default:
        return "申込み中"
    }
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-bold text-strong">申込み履歴</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">申込み履歴がありません</h3>
            <p className="text-gray-500 text-sm">
              イベントやドッグランの申込みを行うと
              <br />
              こちらに履歴が表示されます。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{app.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{app.date}</span>
                      {app.time && <span>{app.time}</span>}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                    {getStatusText(app.status)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {app.details.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{app.details.location}</span>
                    </div>
                  )}
                  {app.details.people && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{app.details.people}名</span>
                    </div>
                  )}
                  {app.details.dogs && (
                    <div className="flex items-center gap-1">
                      <Dog className="w-4 h-4" />
                      <span>{app.details.dogs}頭</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">申込みID: {app.id}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomTabBar />
    </div>
  )
}
