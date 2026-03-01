"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, FileText, MessageSquare, User } from "lucide-react"

import { cn } from "../../lib/utils"

const tabs = [
  { href: "/", icon: Home, label: "ホーム" },
  { href: "/events", icon: Search, label: "イベント" },
  { href: "/reports", icon: FileText, label: "レポート" },
  { href: "/bbs", icon: MessageSquare, label: "掲示板" },
  { href: "/me", icon: User, label: "マイページ" },
]

export default function BottomTabBar() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1",
                "transition-colors duration-200",
                isActive ? "text-brand-primary" : "text-gray-500 hover:text-gray-700",
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate">{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
