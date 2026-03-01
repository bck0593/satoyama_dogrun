"use client"

import { useState } from "react"
import {
  User,
  Settings,
  LogOut,
  Heart,
  Calendar,
  FileText,
  Trophy,
  QrCode,
  Bell,
  Shield,
  HelpCircle,
  Star,
  Edit3,
  Camera,
  Award,
  MessageSquare,
  Clock,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "../contexts/auth-context"
import BottomTabBar from "../components/bottom-tab-bar"
import HomeBar from "../components/home-bar"
import SignInDialog from "../components/sign-in-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function MyPage() {
  const { user, signOut } = useAuth()
  const [showSignIn, setShowSignIn] = useState(false)

  const userStats = {
    eventsAttended: 12,
    favoriteEvents: 8,
    points: 450,
    level: "レギュラー",
    nextLevelPoints: 550,
    joinDate: "2023年4月",
    totalPosts: 24,
    totalLikes: 156,
  }

  const menuItems = [
    {
      icon: Calendar,
      label: "参加予定イベント",
      href: "/my/events",
      description: "申込み済みのイベント",
      badge: "2",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Heart,
      label: "お気に入りイベント",
      href: "/my/favorites",
      description: "気になるイベントを保存",
      badge: "8",
      color: "bg-red-100 text-red-600",
    },
    {
      icon: FileText,
      label: "申込み履歴",
      href: "/my/applications",
      description: "過去の申込み記録",
      color: "bg-green-100 text-green-600",
    },
    {
      icon: MessageSquare,
      label: "投稿履歴",
      href: "/my/posts",
      description: "掲示板への投稿",
      badge: "24",
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: Trophy,
      label: "参加履歴・実績",
      href: "/my/achievements",
      description: "アシさとクラブの活動記録",
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      icon: QrCode,
      label: "アシさと会員証",
      href: "/asisato/membership",
      description: "デジタル会員証を表示",
      color: "bg-indigo-100 text-indigo-600",
    },
  ]

  const settingsItems = [
    {
      icon: Edit3,
      label: "プロフィール編集",
      href: "/my/profile",
      description: "基本情報・アバター変更",
    },
    {
      icon: Bell,
      label: "通知設定",
      href: "/my/notifications",
      description: "プッシュ通知の管理",
    },
    {
      icon: Shield,
      label: "プライバシー設定",
      href: "/my/privacy",
      description: "個人情報の管理",
    },
    {
      icon: Settings,
      label: "アカウント設定",
      href: "/my/settings",
      description: "パスワード・セキュリティ",
    },
    {
      icon: HelpCircle,
      label: "ヘルプ・サポート",
      href: "/my/help",
      description: "よくある質問とお問い合わせ",
    },
  ]

  const recentActivities = [
    {
      type: "event",
      title: "FC今治 vs 愛媛FC観戦イベントに参加",
      time: "2時間前",
      icon: Calendar,
    },
    {
      type: "post",
      title: "掲示板に新しい投稿をしました",
      time: "1日前",
      icon: MessageSquare,
    },
    {
      type: "favorite",
      title: "「今治城ライトアップツアー」をお気に入りに追加",
      time: "3日前",
      icon: Heart,
    },
  ]

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <HomeBar title="マイページ" showBack={false} />

      <div className="px-4 py-6 space-y-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                  <AvatarImage src="/diverse-user-avatars.png" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-bold">
                    {user ? user.name.charAt(0).toUpperCase() : "G"}
                  </AvatarFallback>
                </Avatar>
                {user && (
                  <button className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md border border-gray-200 hover:bg-gray-50 transition-colors">
                    <Camera className="w-3 h-3 text-gray-600" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                {user ? (
                  <>
                    <h2 className="font-bold text-xl text-gray-900 mb-1">{user.name}</h2>
                    <p className="text-gray-600 text-sm mb-3">{user.email}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-blue-600 hover:bg-blue-700">アシさとクラブ会員</Badge>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        {userStats.level}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">{userStats.joinDate}から参加</div>
                  </>
                ) : (
                  <>
                    <h2 className="font-bold text-xl text-gray-900 mb-1">ゲストユーザー</h2>
                    <p className="text-gray-600 text-sm">ログインしてください</p>
                  </>
                )}
              </div>
            </div>

            {user && (
              <>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-lg font-bold text-blue-600">{userStats.eventsAttended}</div>
                    <div className="text-xs text-gray-500">参加回数</div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-lg font-bold text-red-600">{userStats.favoriteEvents}</div>
                    <div className="text-xs text-gray-500">お気に入り</div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-lg font-bold text-purple-600">{userStats.totalPosts}</div>
                    <div className="text-xs text-gray-500">投稿数</div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-lg font-bold text-green-600">{userStats.totalLikes}</div>
                    <div className="text-xs text-gray-500">いいね</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">レベル進捗</span>
                    <span className="text-sm text-gray-500">
                      {userStats.points}/{userStats.nextLevelPoints}pt
                    </span>
                  </div>
                  <Progress value={(userStats.points / userStats.nextLevelPoints) * 100} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">
                    次のレベルまで{userStats.nextLevelPoints - userStats.points}ポイント
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {user ? (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  最近のアクティビティ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="bg-white rounded-full p-2 shadow-sm">
                      <activity.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  すべてのアクティビティを見る
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">マイアクティビティ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {menuItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`rounded-full p-3 ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{item.description}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </a>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {settingsItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="bg-gray-100 rounded-full p-3">
                      <item.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 block mb-1">{item.label}</span>
                      <span className="text-sm text-gray-500">{item.description}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </a>
                ))}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-8 text-center">
              <div className="bg-yellow-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <User className="w-10 h-10 text-yellow-600" />
              </div>
              <h3 className="font-bold text-xl text-yellow-900 mb-3">ログインが必要です</h3>
              <p className="text-yellow-700 text-sm mb-6 leading-relaxed max-w-sm mx-auto">
                イベントの申込みやお気に入り機能、掲示板への投稿など、すべての機能をご利用いただくにはログインが必要です。
              </p>
              <Button
                onClick={() => setShowSignIn(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-2"
              >
                ログイン
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {user ? (
            <Button
              variant="outline"
              onClick={signOut}
              className="w-full flex items-center gap-2 bg-white border-gray-200 hover:bg-gray-50 py-3"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </Button>
          ) : (
            <Button className="w-full bg-blue-600 hover:bg-blue-700 py-3" onClick={() => setShowSignIn(true)}>
              ログイン
            </Button>
          )}
        </div>

        <Card className="bg-gray-100">
          <CardContent className="p-4 text-center text-sm text-gray-600 space-y-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Award className="w-4 h-4 text-blue-600" />
              <span className="font-medium">FC今治コミュニティアプリ</span>
            </div>
            <p className="text-xs">バージョン 1.0.0</p>
            <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-gray-200">
              <a href="/terms" className="text-blue-600 hover:underline text-xs">
                利用規約
              </a>
              <a href="/privacy" className="text-blue-600 hover:underline text-xs">
                プライバシーポリシー
              </a>
              <a href="/contact" className="text-blue-600 hover:underline text-xs">
                お問い合わせ
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <SignInDialog open={showSignIn} onOpenChange={setShowSignIn} />

      <BottomTabBar />
    </div>
  )
}
