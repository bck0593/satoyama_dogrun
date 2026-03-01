import { NextResponse } from "next/server"
import providers from "@/src/mock/providers.json"

export async function GET() {
  try {
    return NextResponse.json(providers)
  } catch (error) {
    console.error("Error fetching providers:", error)
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 })
  }
}
