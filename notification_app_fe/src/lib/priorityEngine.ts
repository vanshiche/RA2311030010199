/**
 * Priority Engine — Frontend
 *
 * Client-side min-heap implementation for computing top-N notifications.
 * Mirrors the Stage 1 backend logic so the frontend is self-contained.
 *
 * Priority Score:  score = (typeWeight × 1e13) + unixTimestampMs
 * Weights:         Placement=3, Result=2, Event=1
 *
 * Algorithm:       Min-heap of size N — O(M log N) for M notifications
 */

import { Notification, NotificationType, ScoredNotification } from "@/types/notification";
import { createLogger } from "@/lib/logger";

const logger = createLogger("PriorityEngine", "utils");

const TYPE_WEIGHTS: Record<NotificationType, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

// ─── Min-Heap ─────────────────────────────────────────────────────────────────

class MinHeap<T> {
  private heap: T[] = [];
  private cmp: (a: T, b: T) => number;

  constructor(cmp: (a: T, b: T) => number) {
    this.cmp = cmp;
  }

  size(): number { return this.heap.length; }
  peek(): T | undefined { return this.heap[0]; }

  push(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (!this.heap.length) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length) { this.heap[0] = last; this.sinkDown(0); }
    return min;
  }

  toArray(): T[] { return [...this.heap]; }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.cmp(this.heap[i], this.heap[p]) < 0) {
        [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
        i = p;
      } else break;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let s = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.cmp(this.heap[l], this.heap[s]) < 0) s = l;
      if (r < n && this.cmp(this.heap[r], this.heap[s]) < 0) s = r;
      if (s !== i) { [this.heap[i], this.heap[s]] = [this.heap[s], this.heap[i]]; i = s; }
      else break;
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

function parseTimestamp(ts: string): number {
  const ms = new Date(ts.replace(" ", "T")).getTime();
  return isNaN(ms) ? 0 : ms;
}

export function computeScore(n: Notification): number {
  const weight = TYPE_WEIGHTS[n.Type] ?? 1;
  const ts = parseTimestamp(n.Timestamp);
  return weight * 1e13 + ts;
}

export function getTopN(
  notifications: Notification[],
  n: number
): ScoredNotification[] {
  logger.info(`Computing top-${n} priority notifications`, {
    total: notifications.length,
  });

  const heap = new MinHeap<ScoredNotification>((a, b) => a.score - b.score);

  for (const notif of notifications) {
    const score = computeScore(notif);
    if (heap.size() < n) {
      heap.push({ notification: notif, score, rank: 0 });
    } else {
      const min = heap.peek();
      if (min && score > min.score) {
        heap.pop();
        heap.push({ notification: notif, score, rank: 0 });
      }
    }
  }

  const results = heap
    .toArray()
    .sort((a, b) => b.score - a.score)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  logger.info("Top-N computation complete", { resultCount: results.length });
  return results;
}
