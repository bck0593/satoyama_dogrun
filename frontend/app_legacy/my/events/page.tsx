"use client"

import { useState, useEffect } from "react"
import { Calendar, MapPin, Users } from "lucide-react"
import HomeBar from "../../components/home-bar"
import BottomTabBar from "../../components/bottom-tab-bar"

type UpcomingEvent = {
  id: string
  title: string
  date: string
  time: string
  location: string
  participants: number
  status: "confirmed" | "pending"
}

export default function UpcomingEventsPage() {
  const [events, setEvents] = useState<UpcomingEvent[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("upcoming_events")
    if (stored) {
      setEvents(JSON.parse(stored))
    }
  }, [])

  const getStatusColor = (status: string) => {
    return status === "confirmed" ? "text-green-600 bg-green-50" : "text-yellow-600 bg-yellow-50"
  }

  const getStatusText = (status: string) => {
    return status === "confirmed" ? "参加確定" : "申込み中"
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <HomeBar title="参加予定イベント" />

      <div className="px-4 py-6">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">参加予定のイベントがありません</h3>
            <p className="text-gray-500 text-sm">
              イベントに申し込むと
              <br />
              こちらに表示されます。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {event.date} {event.time}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {getStatusText(event.status)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{event.participants}名参加予定</span>
                  </div>
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
