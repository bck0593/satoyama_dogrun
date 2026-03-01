"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, MapPin, Users, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import AdminShell from "../../components/admin-shell"
import { Button } from "@/components/ui/button"

type Event = {
  id: string
  title: string
  date: string
  location: string
  capacity: number
  registered: number
  status: "draft" | "published" | "cancelled"
}

export default function AdminEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(data.slice(0, 10)) // Show first 10 events
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "text-green-600 bg-green-50"
      case "cancelled":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "公開中"
      case "cancelled":
        return "キャンセル"
      default:
        return "下書き"
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">イベント管理</h1>
            <p className="text-gray-600">イベントの作成・編集・管理を行います</p>
          </div>
          <Button onClick={() => router.push("/admin/events/new")} className="bg-brand-primary hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            新しいイベント
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">イベント一覧</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {events.map((event) => (
              <div key={event.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">{event.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {getStatusText(event.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {event.registered}/{event.capacity}名
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
