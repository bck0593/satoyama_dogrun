"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Calendar, FileText, MessageSquare, Building2, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type AdminShellProps = {
  children: React.ReactNode
}

export default function AdminShell({ children }: AdminShellProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: "ダッシュボード", href: "/admin", icon: BarChart3 },
    { name: "イベント管理", href: "/admin/events", icon: Calendar },
    { name: "申込み管理", href: "/admin/applications", icon: FileText },
    { name: "レポート管理", href: "/admin/reports", icon: FileText },
    { name: "BBS管理", href: "/admin/bbs", icon: MessageSquare },
    { name: "プロバイダー管理", href: "/admin/providers", icon: Building2 },
  ]

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-900">管理画面</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </a>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <Button variant="outline" onClick={handleLogout} className="w-full bg-transparent">
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-900">管理画面</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </a>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <Button variant="outline" onClick={handleLogout} className="w-full bg-transparent">
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden flex h-16 items-center justify-between px-4 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-400" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">管理画面</h1>
          <div className="w-6" />
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
