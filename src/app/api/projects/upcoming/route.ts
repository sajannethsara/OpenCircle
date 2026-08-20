import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const upcomingProjects = await db.project.findMany({
      where: {
        type: "upcoming",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: upcomingProjects,
    });
  } catch (error) {
    console.error("Error fetching upcoming projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch upcoming projects",
      },
      { status: 500 }
    );
  }
}
