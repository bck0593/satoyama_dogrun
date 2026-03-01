"use client"

import type React from "react"

import { useState } from "react"
import { X, Mail, Lock } from "lucide-react"
import { useAuth } from "../contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"

interface SignInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const { signIn, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await signIn(formData.email, formData.password)
      onOpenChange(false)
      setFormData({ email: "", password: "" })
    } catch (error) {
      console.error("Sign in failed:", error)
      alert("ログインに失敗しました。もう一度お試しください。")
    }
  }

  const handleGoogleSignIn = () => {
    // Mock Google sign in
    signIn("user@gmail.com", "password")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">ログイン</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Google Sign In */}
          <div>
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full flex items-center gap-3 py-3 bg-transparent"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleでログイン
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium mb-2">
                <Mail className="w-4 h-4" />
                メールアドレス
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="example@email.com"
              />
            </div>

            <div>
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium mb-2">
                <Lock className="w-4 h-4" />
                パスワード
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="パスワードを入力"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-brand-primary hover:bg-blue-700">
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500">
            <p>
              アカウントをお持ちでない場合は、
              <br />
              Googleログインで自動的に作成されます。
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
