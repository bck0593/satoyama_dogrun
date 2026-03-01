"use client"

import { Home, ArrowLeft } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"

type HomeBarProps = {
  title?: string
  showBack?: boolean
}

export default function HomeBar({ title, showBack = true }: HomeBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isHomePage = pathname === "/"

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && !isHomePage && (
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          {title && <h1 className="text-lg font-bold text-strong">{title}</h1>}
        </div>

        {!isHomePage && (
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            <span className="text-sm">ホーム</span>
          </Button>
        )}
      </div>
    </div>
  )
}
