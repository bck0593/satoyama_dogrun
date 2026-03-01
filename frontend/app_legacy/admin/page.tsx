"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  FileText,
  MessageSquare,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Shield,
  Database,
} from "lucide-react"
import AdminShell from "../components/admin-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type DashboardStats = {
  todayApplications: number
  publishedEvents: number
  unreadPosts: number
  totalUsers: number
  pendingApplications: number
  activeEvents: number
  totalReports: number
  dogrunReservations: number
}

type RecentActivity = {
  id: string
  type: "application" | "event" | "post" | "reservation"
  title: string
  timestamp: string
  status: "pending" | "approved" | "completed"
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    todayApplications: 0,
    publishedEvents: 0,
    unreadPosts: 0,
    totalUsers: 0,
    pendingApplications: 0,
    activeEvents: 0,
    totalReports: 0,
    dogrunReservations: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    const adminToken = localStorage.getItem("admin_token")
    if (!adminToken) {
      router.push("/admin/login")
      return
    }

    fetchDashboardStats()
    fetchRecentActivity()
  }, [router])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch("/api/admin/recent-activity")
      if (response.ok) {
        const data = await response.json()
        setRecentActivity(data.items || [])
      }
    } catch (error) {
      console.error("Failed to fetch recent activity:", error)
    }
  }

  const statCards = [
    {
      title: "今日の申込み",
      value: stats.todayApplications,
      icon: FileText,
      color: "bg-blue-500",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "公開中イベント",
      value: stats.publishedEvents,
      icon: Calendar,
      color: "bg-green-500",
      trend: "+5%",
      trendUp: true,
    },
    {
      title: "未読投稿",
      value: stats.unreadPosts,
      icon: MessageSquare,
      color: "bg-yellow-500",
      trend: "-8%",
      trendUp: false,
    },
    {
      title: "総ユーザー数",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-purple-500",
      trend: "+15%",
      trendUp: true,
    },
  ]

  const additionalStats = [
    {
      title: "承認待ち申込み",
      value: stats.pendingApplications,
      icon: AlertCircle,
      color: "bg-orange-500",
      urgent: stats.pendingApplications > 5,
    },
    {
      title: "ドッグラン予約",
      value: stats.dogrunReservations,
      icon: Calendar,
      color: "bg-teal-500",
    },
    {
      title: "公開レポート",
      value: stats.totalReports,
      icon: FileText,
      color: "bg-indigo-500",
    },
    {
      title: "アクティブイベント",
      value: stats.activeEvents,
      icon: TrendingUp,
      color: "bg-pink-500",
    },
  ]

  const quickActions = [
    {
      title: "新しいイベントを作成",
      description: "コミュニティイベントを企画・公開",
      icon: Calendar,
      color: "text-blue-500",
      href: "/admin/events/new",
    },
    {
      title: "新しいレポートを作成",
      description: "活動レポートを作成・公開",
      icon: FileText,
      color: "text-green-500",
      href: "/admin/reports/new",
    },
    {
      title: "申込み管理",
      description: "イベント申込みの承認・管理",
      icon: Users,
      color: "text-purple-500",
      href: "/admin/applications",
      badge: stats.pendingApplications > 0 ? stats.pendingApplications.toString() : undefined,
    },
    {
      title: "掲示板管理",
      description: "投稿の管理・モデレーション",
      icon: MessageSquare,
      color: "text-orange-500",
      href: "/admin/bbs",
      badge: stats.unreadPosts > 0 ? stats.unreadPosts.toString() : undefined,
    },
    {
      title: "ドッグラン管理",
      description: "予約状況と施設管理",
      icon: Calendar,
      color: "text-teal-500",
      href: "/admin/dogrun",
    },
    {
      title: "ユーザー管理",
      description: "会員情報とアクセス権限",
      icon: Shield,
      color: "text-red-500",
      href: "/admin/users",
    },
    {
      title: "システム設定",
      description: "アプリ設定とメンテナンス",
      icon: Settings,
      color: "text-gray-500",
      href: "/admin/settings",
    },
    {
      title: "データ分析",
      description: "利用統計とレポート",
      icon: BarChart3,
      color: "text-indigo-500",
      href: "/admin/analytics",
    },
  ]

  return (
    <AdminShell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理ダッシュボード</h1>
            <p className="text-gray-600 mt-1">FC今治コミュニティアプリの管理画面</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              設定
            </Button>
            <Button onClick={() => router.push("/admin/analytics")}>
              <BarChart3 className="w-4 h-4 mr-2" />
              分析
            </Button>
          </div>
        </div>

        {/* Alert Section */}
        {stats.pendingApplications > 5 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-900">承認待ちの申込みが多数あります</h3>
                <p className="text-sm text-orange-700">
                  {stats.pendingApplications}件の申込みが承認待ちです。確認をお願いします。
                </p>
              </div>
              <Button size="sm" onClick={() => router.push("/admin/applications")} className="ml-auto">
                確認する
              </Button>
            </div>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <div
              key={stat.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stat.trendUp ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
                    }`}
                  >
                    {stat.trend}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">前週比</p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {additionalStats.map((stat) => (
            <div key={stat.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${stat.color} rounded-lg p-2`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">{stat.title}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                {(stat as any).urgent && (
                  <Badge variant="destructive" className="text-xs">
                    要確認
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">管理メニュー</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  className="relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-gray-300 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`${action.color} group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{action.title}</h3>
                        {action.badge && (
                          <Badge variant="destructive" className="text-xs">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">最近のアクティビティ</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0 mt-1">
                        {activity.status === "pending" && <Clock className="w-4 h-4 text-yellow-500" />}
                        {activity.status === "approved" && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {activity.status === "completed" && <CheckCircle className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{activity.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">最近のアクティビティはありません</p>
                  </div>
                )}
              </div>
              {recentActivity.length > 8 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    すべて表示
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
