import { NextResponse } from "next/server"
import bbsData from "@/src/mock/bbs.json"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const threadId = params.id
    const comments = bbsData.comments.filter((comment) => comment.thread_id === threadId)

    return NextResponse.json({
      items: comments,
      page: 1,
      page_size: comments.length,
      total: comments.length,
    })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const threadId = params.id
    const body = await request.json()

    const newComment = {
      id: `c${Date.now()}`,
      thread_id: threadId,
      author: body.author,
      body_md: body.body_md,
      created_at: new Date().toISOString(),
    }

    // In a real app, this would save to database
    return NextResponse.json(newComment, { status: 201 })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
