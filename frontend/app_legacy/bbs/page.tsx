"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MessageSquare, Plus, User, Search, ArrowLeft, Heart, MessageCircle } from "lucide-react"
import type { Thread, ApiResponse } from "@/src/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import BottomTabBar from "../components/bottom-tab-bar"
import EmptyState from "../components/empty-state"
import SkeletonCard from "../components/skeleton-card"
import CreateThreadDialog from "../components/create-thread-dialog"

export default function BBSPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("すべて")

  const categoryFilters = ["すべて", "おすすめ情報", "質問・相談", "イベント", "その他"]

  const fetchThreads = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/bbs/threads")
      const data: ApiResponse<Thread> = await response.json()
      setThreads(data.items)
    } catch (error) {
      console.error("Failed to fetch threads:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThreads()
  }, [])

  const handleThreadCreated = (newThread: Thread) => {
    setThreads((prev) => [newThread, ...prev])
    setShowCreateDialog(false)
  }

  const filteredThreads = threads.filter((thread) => {
    const matchesSearch =
      searchQuery === "" ||
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.body_md.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = activeFilter === "すべて" || (thread as any).category === activeFilter

    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">掲示板</h1>
              <p className="text-xs text-gray-500">皆さん同士で情報交換</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4 mr-1" />
            投稿
          </Button>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="投稿を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-100 border-0 rounded-full"
            />
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            {categoryFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredThreads.length > 0 ? (
          <div className="space-y-3">
            {filteredThreads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<MessageSquare className="w-12 h-12" />}
            title="投稿が見つかりません"
            description="検索条件を変更するか、新しい投稿をしてみませんか？"
            action={
              <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                新規投稿
              </Button>
            }
          />
        )}
      </div>

      <CreateThreadDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onThreadCreated={handleThreadCreated}
      />

      <BottomTabBar />
    </div>
  )
}

function ThreadCard({ thread }: { thread: Thread }) {
  // Mock data for demonstration - in real app this would come from the thread data
  const mockCategory = "おすすめ情報"
  const mockLikes = Math.floor(Math.random() * 50) + 1
  const mockComments = Math.floor(Math.random() * 20) + 1
  const timeAgo = `${Math.floor(Math.random() * 24) + 1}時間前`

  return (
    <Link href={`/bbs/${thread.id}`}>
      <div className="bg-white rounded-2xl border border-blue-200 p-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{thread.author}</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{mockCategory}</span>
            </div>
            <span className="text-xs text-gray-500">{timeAgo}</span>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-gray-800 text-sm leading-relaxed line-clamp-3">{thread.body_md}</p>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          <span className="text-blue-600 text-xs">#ドッグラン</span>
          <span className="text-blue-600 text-xs">#新宿</span>
          <span className="text-blue-600 text-xs">#リニューアル</span>
        </div>

        <div className="flex items-center gap-4 text-gray-500">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span className="text-sm">{mockLikes}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{mockComments}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
