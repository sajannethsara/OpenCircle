import { NextResponse } from "next/server"
import { destroyAdminSession } from "@/lib/auth"

export async function POST() {
  try {
    await destroyAdminSession()
    return NextResponse.json({ success: true, message: "Logged out successfully" })
  } catch (error) {
    console.error("Admin logout error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
