import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const adminEmail = process.env.ADMIN_EMAIL || "admin@fcimabari.com"
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123"

    if (email === adminEmail && password === adminPassword) {
      const token = Buffer.from(`${email}:${Date.now()}`).toString("base64")

      return NextResponse.json({
        success: true,
        token,
        message: "ログインに成功しました",
      })
    } else {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
