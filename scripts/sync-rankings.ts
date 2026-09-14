import "dotenv/config";
import { syncAllProjectRankings } from "../src/lib/ranking/server-ranking-sync";

async function main() {
  console.log("==================================================");
  console.log(" OpenCircle Ranking Sync (Headless CLI)");
  console.log("==================================================");

  const forceAll = process.argv.includes("--force");
  const token = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;

  if (!token) {
    console.warn("⚠️  WARNING: No GITHUB_PAT or GITHUB_TOKEN detected in environment.");
    console.warn("    Unauthenticated calls will be subject to strict 60 req/hr limits.");
  } else {
    console.log("✓ GitHub Authentication Token detected.");
  }

  const result = await syncAllProjectRankings({
    forceAll,
    token,
    onProgress: (msg) => console.log(`[Sync] ${msg}`),
  });

  console.log("==================================================");
  console.log(`Sync Result: ${result.success ? "SUCCESS" : "PARTIAL / ERROR"}`);
  console.log(`Total: ${result.totalProjects} | Updated: ${result.updatedProjects} | Errors: ${result.skippedProjects}`);
  console.log(`Duration: ${(result.durationMs / 1000).toFixed(2)}s`);
  console.log("==================================================");

  if (!result.success && result.updatedProjects === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal ranking sync execution error:", err);
  process.exit(1);
});
