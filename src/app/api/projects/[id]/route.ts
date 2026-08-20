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

    const updatedProject = await db.project.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.githubUrl !== undefined && { githubUrl: body.githubUrl }),
        ...(body.branch !== undefined && { branch: body.branch }),
        ...(body.readmeUrl !== undefined && { readmeUrl: body.readmeUrl }),
        ...(body.docFolder !== undefined && { docFolder: body.docFolder }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.score !== undefined && { score: Number(body.score) }),
        ...(body.badge !== undefined && { badge: body.badge }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedProject,
    })
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update project" },
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
    await db.project.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete project" },
      { status: 500 }
    )
  }
}
