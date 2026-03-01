import { type NextRequest, NextResponse } from "next/server"
import eventsData from "@/src/mock/events.json"
import type { Event, ApiResponse } from "@/src/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("page_size") || "10")
    const search = searchParams.get("search") || ""
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []
    const category = searchParams.get("category") || ""
    const venue = searchParams.get("venue") || ""
    const startDate = searchParams.get("start_date") || ""
    const endDate = searchParams.get("end_date") || ""
    const provider = searchParams.get("provider") || ""

    let filteredEvents = [...eventsData] as Event[]

    if (search) {
      filteredEvents = filteredEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(search.toLowerCase()) ||
          event.summary?.toLowerCase().includes(search.toLowerCase()),
      )
    }

    if (tags.length > 0) {
      filteredEvents = filteredEvents.filter((event) => event.tags.some((tag) => tags.includes(tag.slug)))
    }

    if (category) {
      filteredEvents = filteredEvents.filter((event) => event.category?.slug === category)
    }

    if (venue) {
      filteredEvents = filteredEvents.filter((event) => event.venue?.name.toLowerCase().includes(venue.toLowerCase()))
    }

    if (provider) {
      filteredEvents = filteredEvents.filter((event) => event.provider_id === provider)
    }

    if (startDate) {
      filteredEvents = filteredEvents.filter((event) => new Date(event.start_at) >= new Date(startDate))
    }

    if (endDate) {
      filteredEvents = filteredEvents.filter((event) => new Date(event.start_at) <= new Date(endDate))
    }

    // Sort by start date (newest first)
    filteredEvents.sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())

    // Pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

    const response: ApiResponse<Event> = {
      items: paginatedEvents,
      page,
      page_size: pageSize,
      total: filteredEvents.length,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
