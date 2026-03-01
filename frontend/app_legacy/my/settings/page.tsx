"use client"

import { useState } from "react"
import { Bell, Shield, HelpCircle, Info, ChevronRight } from "lucide-react"
import HomeBar from "../../components/home-bar"
import BottomTabBar from "../../components/bottom-tab-bar"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)

  const settingsItems = [
    {
      icon: Bell,
      label: "プッシュ通知",
      type: "switch" as const,
      value: notifications,
      onChange: setNotifications,
    },
    {
      icon: Bell,
      label: "メール通知",
      type: "switch" as const,
      value: emailNotifications,
      onChange: setEmailNotifications,
    },
    {
      icon: Shield,
      label: "プライバシー設定",
      type: "link" as const,
      href: "/my/settings/privacy",
    },
    {
      icon: HelpCircle,
      label: "ヘルプ・サポート",
      type: "link" as const,
      href: "/my/settings/help",
    },
    {
      icon: Info,
      label: "アプリについて",
      type: "link" as const,
      href: "/my/settings/about",
    },
  ]

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <HomeBar title="設定" />

      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {settingsItems.map((item, index) => (
            <div
              key={item.label}
              className={`flex items-center justify-between p-4 ${
                index !== settingsItems.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 rounded-full p-2">
                  <item.icon className="w-5 h-5 text-gray-600" />
                </div>
                <span className="font-medium text-gray-700">{item.label}</span>
              </div>

              {item.type === "switch" ? (
                <Switch checked={item.value} onCheckedChange={item.onChange} />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500 space-y-1">
          <p>FC今治コミュニティアプリ</p>
          <p>バージョン 1.0.0</p>
          <p>© 2024 FC今治</p>
        </div>
      </div>

      <BottomTabBar />
    </div>
  )
}
