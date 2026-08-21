import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { GithubRepo } from "@/lib/github";
import { ProjectType, RankBadge } from "@/generated/prisma/enums";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");

    const whereCondition = typeParam
      ? { type: typeParam as ProjectType }
      : {};

    const projects = await db.project.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubUrl, branch, docFolder, type, score, badge } = body;

    if (!githubUrl || typeof githubUrl !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "githubUrl is required",
        },
        { status: 400 }
      );
    }

    const targetBranch = (branch && typeof branch === "string" && branch.trim()) ? branch.trim() : "main";
    const targetDocFolder = (docFolder && typeof docFolder === "string" && docFolder.trim()) ? docFolder.trim() : "docs";

    const githubService = new GithubRepo(githubUrl, targetBranch);
    const repoInfo = await githubService.getRepo();

    if (!repoInfo) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not fetch repository info from GitHub URL: ${githubUrl}`,
        },
        { status: 400 }
      );
    }

    const newProject = await db.project.create({
      data: {
        name: repoInfo.name,
        description: repoInfo.description,
        githubUrl: repoInfo.url,
        branch: repoInfo.branch,
        readmeUrl: repoInfo.readmeUrl,
        docFolder: targetDocFolder,
        type: type && Object.values(ProjectType).includes(type) ? type : ProjectType.upcoming,
        score: typeof score === "number" ? score : 0,
        badge: badge && Object.values(RankBadge).includes(badge) ? badge : RankBadge.warrior,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newProject,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create project",
      },
      { status: 500 }
    );
  }
}
