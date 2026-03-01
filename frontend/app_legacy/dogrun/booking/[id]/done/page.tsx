import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, Clock, Users, Dog, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import QRCodeDisplay from "../../../components/qr-code-display"
import { getBooking } from "@/src/lib/booking-store"
import BottomTabBar from "../../../../components/bottom-tab-bar"

type Props = {
  params: { id: string }
}

export default async function BookingDonePage({ params }: Props) {
  const booking = getBooking(params.id)

  if (!booking) {
    notFound()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    })
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/dogrun">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">予約完了</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <div className="bg-green-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Dog className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-green-900 mb-2">予約が完了しました！</h2>
          <p className="text-green-700 text-sm">ご来場時にQRコードをスタッフにご提示ください</p>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">チェックイン用QRコード</h3>
          {booking.qr_token && (
            <QRCodeDisplay
              value={`${process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000"}/checkin?token=${booking.qr_token}`}
              size={200}
            />
          )}
          <p className="text-xs text-gray-500 text-center mt-4">QRコードが読み取れない場合は予約番号をお伝えください</p>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">予約詳細</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-lg p-2">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">日程</p>
                <p className="text-sm text-gray-600">{formatDate(booking.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-lg p-2">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">時間</p>
                <p className="text-sm text-gray-600">{booking.time}〜（90分間）</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-lg p-2">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">参加者</p>
                <p className="text-sm text-gray-600">
                  人数: {booking.people}名 / 犬: {booking.dogs}頭
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                予約番号: <span className="font-mono">{booking.number}</span>
              </p>
              <p className="text-sm text-gray-600">お名前: {booking.name}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/my/applications">
            <Button variant="outline" className="w-full bg-transparent">
              マイページで予約を確認
            </Button>
          </Link>

          <form action={`/api/dogrun/booking/${booking.id}/cancel`} method="POST">
            <Button
              variant="outline"
              type="submit"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
            >
              予約をキャンセル
            </Button>
          </form>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="font-bold text-yellow-900 mb-2">ご来場時の注意事項</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• 予約時間の10分前にお越しください</li>
            <li>• ワクチン接種証明書をお持ちください</li>
            <li>• リードは必ずお持ちください</li>
            <li>• 犬の体調に変化がある場合はご利用をお控えください</li>
          </ul>
        </div>
      </div>

      <BottomTabBar />
    </div>
  )
}
