import { type NextRequest, NextResponse } from "next/server"
import { getBooking } from "@/src/lib/booking-store"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const booking = getBooking(params.id)

    if (!booking) {
      return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    return NextResponse.json({ error: "データの取得に失敗しました" }, { status: 500 })
  }
}
