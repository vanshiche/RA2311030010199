/**
 * Entry Point — Campus Notifications System (Stage 1)
 *
 * Fetches all notifications from the evaluation API,
 * computes priority scores using the Min-Heap engine,
 * and prints the top-N results to stdout.
 *
 * Usage:
 *   npm run dev            → default top 10
 *   TOP_N=15 npm run dev   → top 15
 */

import { fetchNotifications } from "./apiClient";
import { getTopN } from "./priorityEngine";
import { createLogger } from "../../logging_middleware/index";

const logger = createLogger("Main", "handler");

// ─── Configuration ────────────────────────────────────────────────────────────

const TOP_N = parseInt(process.env.TOP_N || "10", 10);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function printSeparator(char = "─", width = 80): void {
  process.stdout.write(char.repeat(width) + "\n");
}

function printHeader(title: string): void {
  printSeparator("═");
  process.stdout.write(`  ${title}\n`);
  printSeparator("═");
}

function printResults(
  results: Awaited<ReturnType<typeof getTopN>>
): void {
  printHeader(`🏆  TOP ${TOP_N} PRIORITY NOTIFICATIONS`);
  process.stdout.write("\n");

  if (results.length === 0) {
    process.stdout.write("  ⚠️  No notifications found.\n\n");
    return;
  }

  for (const item of results) {
    const { notification, score, rank } = item;
    printSeparator("─");
    process.stdout.write(
      `  Rank     : #${rank}\n` +
        `  ID       : ${notification.ID}\n` +
        `  Type     : ${notification.Type}\n` +
        `  Message  : ${notification.Message}\n` +
        `  Timestamp: ${notification.Timestamp}\n` +
        `  Score    : ${score.toLocaleString()}\n`
    );
  }

  printSeparator("─");
  process.stdout.write("\n");
  printSeparator("═");
  process.stdout.write(
    `  Processed ${results.length} top notifications (N = ${TOP_N})\n`
  );
  printSeparator("═");
  process.stdout.write("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  logger.info("Campus Notifications Priority Engine — Starting", {
    topN: TOP_N,
    nodeVersion: process.version,
  });

  try {
    // Stage 1: Fetch
    logger.info("Step 1/3 — Fetching notifications from API");
    const notifications = await fetchNotifications();
    logger.info("Step 1/3 — Fetch complete", {
      count: notifications.length,
    });

    // Stage 2: Compute priority
    logger.info("Step 2/3 — Computing priority scores");
    const topN = getTopN(notifications, TOP_N);
    logger.info("Step 2/3 — Priority computation complete", {
      resultCount: topN.length,
    });

    // Stage 3: Output
    logger.info("Step 3/3 — Printing results");
    printResults(topN);
    logger.info("Step 3/3 — Done");
  } catch (err) {
    logger.error("Fatal error in main", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    process.exit(1);
  }
}

main();
