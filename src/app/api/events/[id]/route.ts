import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAdminSession } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const updatedEvent = await db.event.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.date !== undefined && { date: body.date }),
        ...(body.time !== undefined && { time: body.time }),
        ...(body.speaker !== undefined && { speaker: body.speaker }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.link !== undefined && { link: body.link }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedEvent,
    })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update event" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await verifyAdminSession()
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      )
    }

    const { id } = await params
    await db.event.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete event" },
      { status: 500 }
    )
  }
}
