import { type NextRequest, NextResponse } from "next/server"
import { updateBookingStatus } from "@/src/lib/booking-store"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const success = updateBookingStatus(params.id, "cancelled")

    if (!success) {
      return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "予約をキャンセルしました",
    })
  } catch (error) {
    return NextResponse.json({ error: "キャンセル処理に失敗しました" }, { status: 500 })
  }
}
