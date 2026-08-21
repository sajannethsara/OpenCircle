import { NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/auth"

export async function GET() {
  try {
    const isAuthenticated = await verifyAdminSession()
    return NextResponse.json({ authenticated: isAuthenticated })
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
