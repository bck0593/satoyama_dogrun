import { type NextRequest, NextResponse } from "next/server"
import type { DogrunSlot } from "@/src/types"
import { getBookingsByDateAndTime } from "@/src/lib/booking-store"

const baseSlots = [
  { time: "09:00", capacity: 20 },
  { time: "11:00", capacity: 20 },
  { time: "13:00", capacity: 20 },
  { time: "15:00", capacity: 20 },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "日付が指定されていません" }, { status: 400 })
    }

    const slots: DogrunSlot[] = baseSlots.map((slot) => {
      const bookings = getBookingsByDateAndTime(date, slot.time)
      const reserved = bookings.reduce((sum, booking) => sum + booking.people + booking.dogs, 0)

      return {
        date,
        time: slot.time,
        capacity: slot.capacity,
        reserved,
      }
    })

    return NextResponse.json({ slots })
  } catch (error) {
    return NextResponse.json({ error: "データの取得に失敗しました" }, { status: 500 })
  }
}
