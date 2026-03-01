import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split("T")[0]

    const stats = {
      todayApplications: 12,
      publishedEvents: 8,
      unreadPosts: 3,
      totalUsers: 156,
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: "データの取得に失敗しました" }, { status: 500 })
  }
}
