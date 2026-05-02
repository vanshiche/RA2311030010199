/**
 * Priority Engine — Campus Notifications System
 *
 * Computes a priority score for each notification and returns the top-N
 * most important UNREAD notifications using a Min-Heap.
 *
 * Priority Score Formula:
 *   score = (typeWeight * 1e13) + unixTimestampMs
 *
 * Type Weights:
 *   Placement = 3  (highest importance)
 *   Result    = 2
 *   Event     = 1  (lowest importance)
 *
 * By multiplying typeWeight by 1e13 (larger than any realistic timestamp in ms),
 * we ensure type always dominates over recency. Within the same type, newer
 * timestamps score higher.
 *
 * Algorithm:
 *   We maintain a MIN-HEAP of size N (min-heap on score).
 *   For each incoming notification:
 *     - If heap.size < N  → push directly
 *     - Else if score > heap.min → pop min, push new
 *     - Else discard
 *
 *   After processing M notifications: O(M log N)
 *   Each new arriving notification: O(log N) amortised
 *
 * Scaling:
 *   With N=10 (or 20), log N ≈ 4-5 operations per notification regardless
 *   of M growing to millions. This is optimal for streaming data.
 */

import { Notification, NotificationType, ScoredNotification } from "./types";
import { MinHeap } from "./minHeap";
import { createLogger } from "../../logging_middleware/index";

const logger = createLogger("PriorityEngine", "service");

// ─── Type Weight Map ─────────────────────────────────────────────────────────

const TYPE_WEIGHTS: Record<NotificationType, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

/**
 * Parse the API timestamp string "YYYY-MM-DD HH:mm:ss" to Unix ms.
 * The API does not include timezone — treated as local/UTC.
 */
function parseTimestamp(ts: string): number {
  // Replace space with T to make it ISO-compatible
  const isoString = ts.replace(" ", "T");
  const parsed = new Date(isoString).getTime();
  if (isNaN(parsed)) {
    logger.warn(`Invalid timestamp encountered: "${ts}" — defaulting to 0`);
    return 0;
  }
  return parsed;
}

/**
 * Compute a single numeric priority score for a notification.
 */
export function computeScore(notification: Notification): number {
  const weight = TYPE_WEIGHTS[notification.Type] ?? 1;
  const timestampMs = parseTimestamp(notification.Timestamp);
  const score = weight * 1e13 + timestampMs;

  logger.debug(`Score computed`, {
    id: notification.ID,
    type: notification.Type,
    weight,
    timestampMs,
    score,
  });

  return score;
}

/**
 * Get the top-N highest-priority notifications from a list.
 *
 * Uses a Min-Heap of size N so we keep only the N best at all times.
 * Comparator: min-heap on score → root = lowest score among top-N candidates.
 *
 * @param notifications - Full list of notifications from API
 * @param n             - Number of top notifications to return (default 10)
 * @returns             - Array of ScoredNotification sorted descending by score
 */
export function getTopN(
  notifications: Notification[],
  n: number = 10
): ScoredNotification[] {
  logger.info(`Starting top-${n} computation`, {
    totalNotifications: notifications.length,
  });

  // Min-heap: smallest score at root — so we can evict low-scorers
  const heap = new MinHeap<ScoredNotification>(
    (a, b) => a.score - b.score
  );

  for (const notification of notifications) {
    const score = computeScore(notification);
    const candidate: ScoredNotification = { notification, score };

    if (heap.size() < n) {
      heap.push(candidate);
      logger.debug(`Heap push (heap not full)`, { id: notification.ID, score });
    } else {
      const min = heap.peek();
      if (min && score > min.score) {
        const evicted = heap.pop();
        heap.push(candidate);
        logger.debug(`Evicted low-priority notification`, {
          evictedId: evicted?.notification.ID,
          evictedScore: evicted?.score,
          newId: notification.ID,
          newScore: score,
        });
      } else {
        logger.debug(`Discarded lower-priority notification`, {
          id: notification.ID,
          score,
          heapMin: min?.score,
        });
      }
    }
  }

  // Extract all from heap and sort descending (highest priority first)
  const results = heap
    .toArray()
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  logger.info(`Top-${n} computation complete`, {
    resultCount: results.length,
    topScore: results[0]?.score,
    bottomScore: results[results.length - 1]?.score,
  });

  return results;
}
