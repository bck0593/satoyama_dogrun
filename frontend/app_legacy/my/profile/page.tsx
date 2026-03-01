"use client"

import { useState } from "react"
import { ArrowLeft, Camera, Save, User, Mail, Phone, MapPin, Calendar } from "lucide-react"
import { useAuth } from "../../contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    location: "愛媛県今治市",
    bio: "FC今治を応援しています！",
    birthDate: "",
  })

  const handleSave = () => {
    // Here you would typically save to backend
    setIsEditing(false)
    // Show success message
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">プロフィール編集</h1>
          <div className="ml-auto">
            {isEditing ? (
              <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                編集
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarImage src="/user-profile-illustration.png" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold">
                    {user ? user.name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <button className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2 shadow-lg hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
              {!isEditing && (
                <div className="text-center mt-4">
                  <h2 className="text-xl font-bold text-gray-900">{formData.name}</h2>
                  <p className="text-gray-600">{formData.email}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  お名前
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4" />
                  メールアドレス
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  電話番号
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                  placeholder="090-1234-5678"
                />
              </div>

              <div>
                <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  お住まい
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>

              <div>
                <Label htmlFor="birthDate" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  生年月日
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-sm font-medium text-gray-700 mb-2 block">
                  自己紹介
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                  rows={3}
                  placeholder="自己紹介を入力してください"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
              キャンセル
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
              保存
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
