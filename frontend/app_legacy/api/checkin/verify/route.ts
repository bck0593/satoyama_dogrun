import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyCheckinToken } from "@/src/lib/checkin"
import { getBooking, updateBookingStatus, recordCheckin, getCheckin } from "@/src/lib/booking-store"

const verifySchema = z.object({
  token: z.string(),
  staffPin: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, staffPin } = verifySchema.parse(body)

    const requiredPin = process.env.NEXT_PUBLIC_STAFF_PIN || "1234"
    if (staffPin !== requiredPin) {
      return NextResponse.json({ error: "スタッフPINが正しくありません" }, { status: 401 })
    }

    const payload = verifyCheckinToken(token)
    if (!payload) {
      return NextResponse.json({ error: "QRコードが無効または期限切れです" }, { status: 401 })
    }

    const booking = getBooking(payload.bookingId)
    if (!booking) {
      return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 })
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "キャンセルされた予約です" }, { status: 410 })
    }

    const existingCheckin = getCheckin(payload.bookingId)
    if (existingCheckin) {
      return NextResponse.json(
        { error: "既にチェックイン済みです", checkedInAt: existingCheckin.when },
        { status: 409 },
      )
    }

    const bookingDate = new Date(payload.date)
    const now = new Date()
    const diffHours = Math.abs(now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60)

    if (diffHours > 24) {
      return NextResponse.json({ error: "予約日が異なります" }, { status: 400 })
    }

    updateBookingStatus(payload.bookingId, "checked_in")
    recordCheckin(payload.bookingId)

    return NextResponse.json({
      ok: true,
      bookingId: payload.bookingId,
      when: new Date().toISOString(),
      booking: {
        name: booking.name,
        date: booking.date,
        time: booking.time,
        people: booking.people,
        dogs: booking.dogs,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "入力データが正しくありません" }, { status: 400 })
    }

    return NextResponse.json({ error: "チェックイン処理に失敗しました" }, { status: 500 })
  }
}
