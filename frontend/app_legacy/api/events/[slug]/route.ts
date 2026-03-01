import { type NextRequest, NextResponse } from "next/server"
import eventsData from "@/src/mock/events.json"
import type { Event } from "@/src/types"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const event = eventsData.find((e) => e.slug === params.slug) as Event | undefined

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const event = eventsData.find((e) => e.slug === params.slug) as Event | undefined

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.application_type !== "internal_form") {
      return NextResponse.json({ error: "This event does not accept internal applications" }, { status: 400 })
    }

    const body = await request.json()

    // Mock application processing
    const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // In a real app, this would save to database
    console.log("Application received:", {
      eventSlug: params.slug,
      applicationId,
      data: body,
    })

    return NextResponse.json({
      status: "success",
      id: applicationId,
      message: "申込みを受け付けました。確認メールをお送りいたします。",
    })
  } catch (error) {
    console.error("Error processing application:", error)
    return NextResponse.json({ error: "Failed to process application" }, { status: 500 })
  }
}
