import { type NextRequest, NextResponse } from "next/server"
import reportsData from "@/src/mock/reports.json"
import type { Report } from "@/src/types"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const report = reportsData.find((r) => r.slug === params.slug) as Report | undefined

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error fetching report:", error)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}
