import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { syncAllProjectRankings } from "@/lib/ranking/server-ranking-sync";

/**
 * POST /api/admin/rankings
 *
 * Server-side ranking sync endpoint.
 * Protected by either:
 *   1. Active Admin Cookie Session (from the web UI)
 *   2. CRON_SECRET Bearer Token (from external scheduler or webhook)
 */
export async function POST(request: NextRequest) {
  try {
    // Check Authorization: Admin Session or CRON_SECRET
    const isAdmin = await verifyAdminSession();
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized =
      Boolean(cronSecret) &&
      Boolean(authHeader) &&
      authHeader === `Bearer ${cronSecret}`;

    if (!isAdmin && !isCronAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Parse options
    let forceAll = false;
    let projectIds: string[] | undefined;

    try {
      const body = await request.json();
      if (typeof body.forceAll === "boolean") forceAll = body.forceAll;
      if (Array.isArray(body.projectIds)) projectIds = body.projectIds;
    } catch {
      // Body may be empty on basic triggers
    }

    const { searchParams } = new URL(request.url);
    if (searchParams.get("force") === "true") forceAll = true;

    // Run server sync
    const result = await syncAllProjectRankings({
      forceAll,
      projectIds,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin rankings sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal sync error",
      },
      { status: 500 }
    );
  }
}
