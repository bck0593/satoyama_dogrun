"use client"

import type React from "react"
import { useState } from "react"
import { X, User, Mail, Phone, MessageSquare, Calendar, Clock, Users, Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { applyToEvent } from "@/src/lib/api"
import type { Event } from "@/src/types"

import { useAuth } from "../contexts/auth-context"

interface ApplyDialogProps {
  event: Event
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ApplyDialog({ event, open, onOpenChange }: ApplyDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [applicationId, setApplicationId] = useState("")

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    headcount: 1,
    message: "",
    agreement: false,
    visitDate: "",
    timeSlot: "",
    dogCount: 1,
    vaccinationStatus: false,
    classSelection: "",
    skillLevel: "",
    programSelection: "",
    accompaniedCount: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.agreement) {
      alert("申し込み規約と個人情報の取扱いに同意してください。")
      return
    }

    setLoading(true)

    try {
      const response = await applyToEvent(event.slug, formData)
      setApplicationId(response.id)
      setSuccess(true)
    } catch (error) {
      console.error("Application failed:", error)
      alert("申込みの送信に失敗しました。時間をおいて再度お試しください。")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSuccess(false)
    setApplicationId("")
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      headcount: 1,
      message: "",
      agreement: false,
      visitDate: "",
      timeSlot: "",
      dogCount: 1,
      vaccinationStatus: false,
      classSelection: "",
      skillLevel: "",
      programSelection: "",
      accompaniedCount: 0,
    })
    onOpenChange(false)
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-green-600">申込みを受け付けました</DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="py-6 text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">ご入力ありがとうございました</h3>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600 mb-1">受付番号</p>
              <p className="font-mono text-sm font-bold text-gray-900">{applicationId}</p>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              ご登録いただいたメールアドレス宛に控えをお送りしました。<br />
              内容を確認のうえ、担当者より追ってご連絡いたします。
            </p>

            <Button onClick={handleClose} className="w-full bg-brand-primary hover:bg-blue-700 text-white">
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">{event.title} 申込みフォーム</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </div>
          <p className="text-sm text-gray-500 pt-2">
            必要事項をご入力のうえ送信してください。内容確認のため担当者からご連絡を差し上げます。
          </p>
        </DialogHeader>

        <div className="max-h-[75vh] overflow-y-auto pr-1">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium mb-2">
                <User className="w-4 h-4" />
                ご担当者名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="例）今治 太郎"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Mail className="w-4 h-4" />
                  メールアドレス <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="example@fcimabari.com"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Phone className="w-4 h-4" />
                  電話番号
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="080-1234-5678"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="visitDate" className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4" />
                  参加予定日
                </Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, visitDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="timeSlot" className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Clock className="w-4 h-4" />
                  希望時間帯
                </Label>
                <Input
                  id="timeSlot"
                  placeholder="例）10:00〜、午後から参加 など"
                  value={formData.timeSlot}
                  onChange={(e) => setFormData((prev) => ({ ...prev, timeSlot: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="headcount" className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Users className="w-4 h-4" />
                  参加人数
                </Label>
                <Input
                  id="headcount"
                  type="number"
                  min="1"
                  value={formData.headcount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, headcount: Number.parseInt(e.target.value, 10) || 1 }))
                  }
                />
              </div>

              {event.provider_id === "tgf" && (
                <div>
                  <Label htmlFor="accompaniedCount" className="flex items-center gap-2 text-sm font-medium mb-2">
                    同行予定の人数
                  </Label>
                  <Input
                    id="accompaniedCount"
                    type="number"
                    min="0"
                    max="5"
                    value={formData.accompaniedCount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        accompaniedCount: Number.parseInt(e.target.value, 10) || 0,
                      }))
                    }
                  />
                </div>
              )}
            </div>

            {event.provider_id === "dogrun" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dogCount" className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Heart className="w-4 h-4" />
                    同伴される頭数
                  </Label>
                  <Input
                    id="dogCount"
                    type="number"
                    min="1"
                    value={formData.dogCount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, dogCount: Number.parseInt(e.target.value, 10) || 1 }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Checkbox
                    id="vaccinationStatus"
                    checked={formData.vaccinationStatus}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, vaccinationStatus: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="vaccinationStatus" className="text-sm">
                    狂犬病・混合ワクチンの接種証明を持参します
                  </Label>
                </div>
              </div>
            )}

            {event.provider_id === "asisato" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="classSelection" className="flex items-center gap-2 text-sm font-medium mb-2">
                    参加希望クラス <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.classSelection}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, classSelection: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="クラスを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">ビギナー</SelectItem>
                      <SelectItem value="intermediate">ミドル</SelectItem>
                      <SelectItem value="advanced">アドバンス</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="skillLevel" className="flex items-center gap-2 text-sm font-medium mb-2">
                    経験レベル
                  </Label>
                  <Select
                    value={formData.skillLevel}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, skillLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="レベルを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first-time">初めて参加</SelectItem>
                      <SelectItem value="experienced">経験あり</SelectItem>
                      <SelectItem value="regular">リピート参加</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {event.provider_id === "tgf" && (
              <div>
                <Label htmlFor="programSelection" className="flex items-center gap-2 text-sm font-medium mb-2">
                  希望プログラム <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.programSelection}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, programSelection: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="プログラムを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main-stage">メインステージ</SelectItem>
                    <SelectItem value="workshop">ワークショップ</SelectItem>
                    <SelectItem value="food-area">フードエリア</SelectItem>
                    <SelectItem value="all-access">終日フリーパス</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="message" className="flex items-center gap-2 text-sm font-medium mb-2">
                <MessageSquare className="w-4 h-4" />
                ご質問・連絡事項
              </Label>
              <Textarea
                id="message"
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="当日の持ち込み予定、配慮してほしい点などがあればご記入ください。"
              />
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="agreement"
                checked={formData.agreement}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreement: Boolean(checked) }))}
              />
              <Label htmlFor="agreement" className="text-sm leading-relaxed">
                参加規約および個人情報の取り扱いに同意します <span className="text-red-500">*</span>
              </Label>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading || !formData.agreement} className="w-full bg-brand-primary hover:bg-blue-700">
                {loading ? "送信中..." : "申込み内容を送信"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
