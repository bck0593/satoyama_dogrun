import { NextResponse } from "next/server"
import bbsData from "@/src/mock/bbs.json"

export async function GET() {
  try {
    return NextResponse.json({
      items: bbsData.threads,
      page: 1,
      page_size: bbsData.threads.length,
      total: bbsData.threads.length,
    })
  } catch (error) {
    console.error("Error fetching threads:", error)
    return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newThread = {
      id: `th${Date.now()}`,
      title: body.title,
      created_at: new Date().toISOString(),
      author: body.author,
      body_md: body.body_md,
    }

    // In a real app, this would save to database
    // For now, just return the created thread
    return NextResponse.json(newThread, { status: 201 })
  } catch (error) {
    console.error("Error creating thread:", error)
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 })
  }
}
