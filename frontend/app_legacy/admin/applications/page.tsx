"use client"

import { useState, useEffect } from "react"
import { Calendar, MapPin, Users, Dog, Check, X } from "lucide-react"
import AdminShell from "../../components/admin-shell"
import { Button } from "@/components/ui/button"

type Application = {
  id: string
  type: "event" | "dogrun"
  title: string
  userName: string
  userEmail: string
  date: string
  time?: string
  status: "pending" | "confirmed" | "cancelled"
  details: {
    people?: number
    dogs?: number
    location?: string
  }
  createdAt: string
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = () => {
    const mockApplications: Application[] = [
      {
        id: "app-001",
        type: "event",
        title: "TINY GARDEN FESTIVAL 2024",
        userName: "田中太郎",
        userEmail: "tanaka@example.com",
        date: "2024-04-15",
        time: "10:00",
        status: "pending",
        details: { people: 2, location: "今治市民の森" },
        createdAt: "2024-03-20T09:00:00Z",
      },
      {
        id: "app-002",
        type: "dogrun",
        title: "ドッグラン利用",
        userName: "佐藤花子",
        userEmail: "sato@example.com",
        date: "2024-04-10",
        time: "14:00-16:00",
        status: "confirmed",
        details: { dogs: 1, location: "FC今治ドッグラン" },
        createdAt: "2024-03-18T14:30:00Z",
      },
    ]
    setApplications(mockApplications)
  }

  const updateApplicationStatus = (id: string, status: "confirmed" | "cancelled") => {
    setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status } : app)))
  }

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
        return "承認済み"
      case "cancelled":
        return "キャンセル"
      default:
        return "申込み中"
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">申込み管理</h1>
          <p className="text-gray-600">イベントとドッグランの申込みを管理します</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">申込み一覧</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {applications.map((app) => (
              <div key={app.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900">{app.title}</h3>
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                        {app.type === "event" ? "イベント" : "ドッグラン"}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {getStatusText(app.status)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <p>
                        <strong>申込者:</strong> {app.userName} ({app.userEmail})
                      </p>
                      <p>
                        <strong>申込日:</strong> {new Date(app.createdAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {app.date} {app.time}
                        </span>
                      </div>
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
                  </div>

                  {app.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateApplicationStatus(app.id, "confirmed")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        承認
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateApplicationStatus(app.id, "cancelled")}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        拒否
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
