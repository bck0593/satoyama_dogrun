import Link from "next/link"
import { Calendar, Clock, MapPin, Users, Dog, Shield, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import BottomTabBar from "../components/bottom-tab-bar"

export default function DogrunPage() {
  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-4 pt-12 pb-8">
        <div className="text-center">
          <div className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Dog className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">大島ドッグラン</h1>
          <p className="text-orange-100 text-sm leading-relaxed">
            愛犬と一緒に安全で楽しい時間を
            <br />
            お過ごしいただけます
          </p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Facility Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">施設案内</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">所在地</p>
                <p className="text-sm text-gray-600">愛媛県今治市大島町宮窪町宮窪1234</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">営業時間</p>
                <p className="text-sm text-gray-600">9:00〜17:00（最終受付 15:30）</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">利用時間</p>
                <p className="text-sm text-gray-600">1回90分制（入替時間含む）</p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Rules */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ご利用規約</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">ワクチン接種必須</p>
                <p className="text-sm text-gray-600">狂犬病予防接種・混合ワクチン接種済みの犬のみ</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">健康状態の確認</p>
                <p className="text-sm text-gray-600">発情中・体調不良の犬はご利用いただけません</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">飼い主同伴必須</p>
                <p className="text-sm text-gray-600">犬だけでのご利用はできません</p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking CTA */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-center text-white">
          <h3 className="text-lg font-bold mb-2">ご予約はこちら</h3>
          <p className="text-orange-100 text-sm mb-4 leading-relaxed">
            事前予約制となっております
            <br />
            ご利用希望日の予約をお取りください
          </p>
          <Link href="/dogrun/book">
            <Button className="bg-white text-orange-600 hover:bg-gray-50 font-medium">
              <Calendar className="w-4 h-4 mr-2" />
              予約する
            </Button>
          </Link>
        </div>

        {/* Contact Info */}
        <div className="bg-gray-100 rounded-2xl p-6 text-center">
          <h3 className="font-bold text-gray-900 mb-2">お問い合わせ</h3>
          <p className="text-sm text-gray-600 mb-2">大島ドッグラン管理事務所</p>
          <p className="text-sm text-gray-600">TEL: 0898-12-3456</p>
        </div>
      </div>

      <BottomTabBar />
    </div>
  )
}
