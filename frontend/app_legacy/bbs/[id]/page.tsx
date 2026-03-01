"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MessageSquare, User, Clock, Send } from "lucide-react"
import { notFound } from "next/navigation"
import type { Thread, Comment, ApiResponse } from "@/src/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import HomeBar from "../../components/home-bar"
import SkeletonCard from "../../components/skeleton-card"

interface ThreadDetailPageProps {
  params: { id: string }
}

export default function ThreadDetailPage({ params }: ThreadDetailPageProps) {
  const [thread, setThread] = useState<Thread | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [commentForm, setCommentForm] = useState({
    author: "",
    body_md: "",
  })

  const fetchThread = async () => {
    try {
      // Fetch thread from threads list (since we don't have individual thread API)
      const threadsResponse = await fetch("/api/bbs/threads")
      const threadsData: ApiResponse<Thread> = await threadsResponse.json()
      const foundThread = threadsData.items.find((t) => t.id === params.id)

      if (!foundThread) {
        notFound()
        return
      }

      setThread(foundThread)

      // Fetch comments
      const commentsResponse = await fetch(`/api/bbs/threads/${params.id}/comments`)
      const commentsData: ApiResponse<Comment> = await commentsResponse.json()
      setComments(commentsData.items)
    } catch (error) {
      console.error("Failed to fetch thread:", error)
      notFound()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentForm.author.trim() || !commentForm.body_md.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/bbs/threads/${params.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commentForm),
      })

      if (response.ok) {
        const newComment: Comment = await response.json()
        setComments((prev) => [...prev, newComment])
        setCommentForm({ author: "", body_md: "" })
      }
    } catch (error) {
      console.error("Failed to submit comment:", error)
      alert("コメントの投稿に失敗しました")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    fetchThread()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen">
        <HomeBar title="掲示板" />
        <div className="px-4 py-6 space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (!thread) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeBar title="掲示板" />

      <div className="px-4 py-6 space-y-6">
        {/* Thread */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-xl font-bold text-strong leading-tight mb-4 text-balance">{thread.title}</h1>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{thread.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>
                {new Date(thread.created_at).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{thread.body_md}</div>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-strong flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            コメント ({comments.length})
          </h2>

          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">まだコメントがありません</p>
            </div>
          )}
        </div>

        {/* Comment Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-lg text-strong mb-4">コメントを投稿</h3>

          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div>
              <Label htmlFor="author" className="text-sm font-medium mb-2 block">
                お名前 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="author"
                type="text"
                required
                value={commentForm.author}
                onChange={(e) => setCommentForm((prev) => ({ ...prev, author: e.target.value }))}
                placeholder="お名前を入力してください"
              />
            </div>

            <div>
              <Label htmlFor="comment" className="text-sm font-medium mb-2 block">
                コメント <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="comment"
                required
                rows={4}
                value={commentForm.body_md}
                onChange={(e) => setCommentForm((prev) => ({ ...prev, body_md: e.target.value }))}
                placeholder="コメントを入力してください"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !commentForm.author.trim() || !commentForm.body_md.trim()}
              className="w-full bg-brand-primary hover:bg-blue-700"
            >
              {submitting ? (
                "投稿中..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  コメントを投稿
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

function CommentCard({ comment }: { comment: Comment }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span className="font-medium">{comment.author}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            {new Date(comment.created_at).toLocaleDateString("ja-JP", {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.body_md}</div>
    </div>
  )
}
