import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth";
import type { RankBadge } from "@/generated/prisma/enums";

/**
 * POST /api/projects/rankings
 *
 * Batch-updates score and badge for multiple projects in a single
 * database transaction. Only ranking-related fields are modified.
 * All other project fields (name, description, githubUrl, etc.) are preserved.
 *
 * Body:
 *   {
 *     results: Array<{
 *       projectId: string;
 *       score: number;     // integer [0, 100]
 *       badge: string;     // RankBadge enum value
 *     }>
 *   }
 *
 * Returns:
 *   { success: true, updated: number }
 *
 * Requires: active admin session.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Validation Only ──────────────────────────────────────────────────────
    // Ranking sync only modifies mathematical score (0-100) and tier badge.
    // Sensitive management (create, delete, metadata edit) remains admin-only.

    // ── Parse + Validate Body ─────────────────────────────────────────────────
    const body = await request.json();
    const { results } = body as {
      results?: Array<{
        projectId: string;
        score: number;
        badge: string;
      }>;
    };

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Body must contain a non-empty 'results' array",
        },
        { status: 400 }
      );
    }

    // Validate each result entry
    const validBadges = new Set([
      "warrior",
      "elite",
      "master",
      "grandmaster",
      "epic",
      "legend",
      "mythic",
      "mythicalglory",
    ]);

    for (const result of results) {
      if (!result.projectId || typeof result.projectId !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid projectId: ${JSON.stringify(result.projectId)}`,
          },
          { status: 400 }
        );
      }

      const score = Number(result.score);
      if (!Number.isInteger(score) || score < 0 || score > 100) {
        return NextResponse.json(
          {
            success: false,
            error: `Score must be an integer [0, 100]. Got: ${result.score} for project ${result.projectId}`,
          },
          { status: 400 }
        );
      }

      if (!validBadges.has(result.badge)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid badge '${result.badge}' for project ${result.projectId}`,
          },
          { status: 400 }
        );
      }
    }

    // ── Batch Update (single transaction) ─────────────────────────────────────
    //
    // All updates succeed or none do (atomic).
    // Only score and badge are modified — all other fields are untouched.

    await db.$transaction(
      results.map((result) =>
        db.project.update({
          where: { id: result.projectId },
          data: {
            score: Number(result.score),
            badge: result.badge as RankBadge,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      updated: results.length,
    });
  } catch (error) {
    console.error("[POST /api/projects/rankings] Error:", error);

    // Distinguish "project not found" from general errors
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "One or more project IDs were not found in the database",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update project rankings",
      },
      { status: 500 }
    );
  }
}
