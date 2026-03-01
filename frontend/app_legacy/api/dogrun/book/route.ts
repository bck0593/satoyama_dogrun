import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { DogrunBooking } from "@/src/types"
import { saveBooking, getBookingsByDateAndTime } from "@/src/lib/booking-store"
import { generateCheckinToken } from "@/src/lib/checkin"

const bookingSchema = z.object({
  date: z.string(),
  time: z.string(),
  people: z.number().min(1),
  dogs: z.number().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  dogs_detail: z
    .array(
      z.object({
        name: z.string().optional(),
        breed: z.string().optional(),
      }),
    )
    .optional(),
  health: z.object({
    rabies: z.boolean(),
    mixed_vaccine: z.boolean(),
    in_heat: z.boolean().optional(),
  }),
  agree: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    if (!validatedData.health.rabies || !validatedData.health.mixed_vaccine) {
      return NextResponse.json({ error: "ワクチン接種が完了していない犬はご利用いただけません" }, { status: 400 })
    }

    if (validatedData.health.in_heat) {
      return NextResponse.json({ error: "発情中の犬はご利用いただけません" }, { status: 400 })
    }

    if (!validatedData.agree) {
      return NextResponse.json({ error: "利用規約への同意が必要です" }, { status: 400 })
    }

    const existingBookings = getBookingsByDateAndTime(validatedData.date, validatedData.time)
    const currentReserved = existingBookings.reduce((sum, booking) => sum + booking.people + booking.dogs, 0)
    const requestedSlots = validatedData.people + validatedData.dogs

    if (currentReserved + requestedSlots > 20) {
      return NextResponse.json({ error: "ご希望の時間帯は満席です" }, { status: 400 })
    }

    const dateStr = validatedData.date.replace(/-/g, "")
    const randomNum = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")
    const bookingId = `DR-${dateStr}-${randomNum}`

    const tokenPayload = {
      kind: "dogrun" as const,
      bookingId,
      date: validatedData.date,
      time: validatedData.time,
      email: validatedData.email,
    }
    const qrToken = generateCheckinToken(tokenPayload)

    const booking: DogrunBooking = {
      id: bookingId,
      date: validatedData.date,
      time: validatedData.time,
      people: validatedData.people,
      dogs: validatedData.dogs,
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      dogs_detail: validatedData.dogs_detail,
      health: validatedData.health,
      status: "pending",
      qr_token: qrToken,
      number: bookingId,
      created_at: new Date().toISOString(),
    }

    saveBooking(booking)

    const userApplications = JSON.parse(localStorage?.getItem("user_applications") || "[]")
    userApplications.push({
      id: bookingId,
      type: "dogrun",
      title: "ドッグラン予約",
      date: validatedData.date,
      time: validatedData.time,
      status: "confirmed",
      details: {
        people: validatedData.people,
        dogs: validatedData.dogs,
        location: "大島ドッグラン",
      },
    })

    return NextResponse.json({
      id: bookingId,
      date: validatedData.date,
      time: validatedData.time,
      people: validatedData.people,
      dogs: validatedData.dogs,
      qr: {
        token: qrToken,
        url: `/checkin?token=${qrToken}`,
        payload: tokenPayload,
      },
      number: bookingId,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "入力データが正しくありません", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "予約の作成に失敗しました" }, { status: 500 })
  }
}
