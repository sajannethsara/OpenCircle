import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAdminSession } from "@/lib/auth"

export async function GET() {
  try {
    const events = await db.event.findMany({
      orderBy: { eventDate: "asc" },
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
    const { title, eventDate, speaker, link, notesMd } = body

    if (!title || !eventDate) {
      return NextResponse.json(
        { success: false, error: "Title and Event Date are required" },
        { status: 400 }
      )
    }

    const parsedDate = new Date(eventDate)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid event date format" },
        { status: 400 }
      )
    }

    const newEvent = await db.event.create({
      data: {
        title: title.trim(),
        eventDate: parsedDate,
        speaker: (speaker && typeof speaker === "string") ? speaker.trim() : "Batch 23 Lead",
        link: (link && typeof link === "string") ? link.trim() : "",
        notesMd: (notesMd && typeof notesMd === "string") ? notesMd.trim() : "",
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
