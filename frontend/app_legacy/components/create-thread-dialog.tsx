"use client"

import type React from "react"

import { useState } from "react"
import { X, MessageSquare, Send } from "lucide-react"
import type { Thread } from "@/src/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"

interface CreateThreadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onThreadCreated: (thread: Thread) => void
}

export default function CreateThreadDialog({ open, onOpenChange, onThreadCreated }: CreateThreadDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    body_md: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.author.trim() || !formData.body_md.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/bbs/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newThread: Thread = await response.json()
        onThreadCreated(newThread)
        setFormData({ title: "", author: "", body_md: "" })
      } else {
        throw new Error("Failed to create thread")
      }
    } catch (error) {
      console.error("Failed to create thread:", error)
      alert("投稿の作成に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ title: "", author: "", body_md: "" })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              新規投稿
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium mb-2 block">
                タイトル <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="投稿のタイトルを入力してください"
              />
            </div>

            <div>
              <Label htmlFor="author" className="text-sm font-medium mb-2 block">
                お名前 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="author"
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                placeholder="お名前を入力してください"
              />
            </div>

            <div>
              <Label htmlFor="body" className="text-sm font-medium mb-2 block">
                内容 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="body"
                required
                rows={6}
                value={formData.body_md}
                onChange={(e) => setFormData((prev) => ({ ...prev, body_md: e.target.value }))}
                placeholder="投稿内容を入力してください"
              />
            </div>

            <div className="pt-4 space-y-3">
              <Button
                type="submit"
                disabled={loading || !formData.title.trim() || !formData.author.trim() || !formData.body_md.trim()}
                className="w-full bg-brand-primary hover:bg-blue-700"
              >
                {loading ? (
                  "投稿中..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    投稿する
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center leading-relaxed">
                投稿する前に、コミュニティガイドラインをご確認ください。
              </p>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
