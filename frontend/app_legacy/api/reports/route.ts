import { type NextRequest, NextResponse } from "next/server"
import reportsData from "@/src/mock/reports.json"
import type { Report, ApiResponse } from "@/src/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl

    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("page_size") || "10")
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []

    let filteredReports = [...reportsData] as Report[]

    if (tags.length > 0) {
      filteredReports = filteredReports.filter((report) => report.tags.some((tag) => tags.includes(tag.slug)))
    }

    // Sort by published date (newest first)
    filteredReports.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())

    // Pagination
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedReports = filteredReports.slice(startIndex, endIndex)

    const response: ApiResponse<Report> = {
      items: paginatedReports,
      page,
      page_size: pageSize,
      total: filteredReports.length,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
  }
}
