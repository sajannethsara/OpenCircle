import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAdminSession } from "@/lib/auth"

export async function GET() {
  try {
    const events = await db.event.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      data: events,
    })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, date, time, speaker, type, status, link } = body

    if (!title || !date) {
      return NextResponse.json(
        { success: false, error: "Title and Date are required" },
        { status: 400 }
      )
    }

    const newEvent = await db.event.create({
      data: {
        title: title.trim(),
        date: date.trim(),
        time: (time && typeof time === "string") ? time.trim() : "7:00 PM - 8:30 PM",
        speaker: (speaker && typeof speaker === "string") ? speaker.trim() : "Batch 23 Lead",
        type: (type && typeof type === "string") ? type.trim() : "Workshop",
        status: (status && typeof status === "string") ? status.trim() : "Upcoming",
        link: (link && typeof link === "string") ? link.trim() : "",
      },
    })

    return NextResponse.json({
      success: true,
      data: newEvent,
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create event" },
      { status: 500 }
    )
  }
}
