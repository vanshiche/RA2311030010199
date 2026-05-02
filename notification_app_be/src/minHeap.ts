/**
 * MinHeap<T> — Generic Min-Heap Data Structure
 *
 * Maintains the smallest element at the root based on a comparator.
 * Used in the priority engine to efficiently maintain top-N notifications.
 *
 * Time Complexities:
 *   push   → O(log n)
 *   pop    → O(log n)
 *   peek   → O(1)
 *   size   → O(1)
 *
 * Strategy for Top-N:
 *   Keep heap size ≤ N. When a new element arrives:
 *   - If heap.size < N → push directly
 *   - Else if new element > heap root → pop root, push new element
 *   - Else discard new element
 *
 *   Result: O(M log N) for M total notifications, much better than O(M log M) sort.
 */

import { createLogger } from "../../logging_middleware/index";

const logger = createLogger("MinHeap", "utils");

export class MinHeap<T> {
  private readonly heap: T[] = [];
  private readonly comparator: (a: T, b: T) => number;

  constructor(comparator: (a: T, b: T) => number) {
    this.comparator = comparator;
    logger.debug("MinHeap initialized");
  }

  /** Number of elements in the heap */
  size(): number {
    return this.heap.length;
  }

  /** View the minimum element without removing it — O(1) */
  peek(): T | undefined {
    return this.heap[0];
  }

  /** Insert a new element and restore heap property — O(log n) */
  push(item: T): void {
    this.heap.push(item);
    logger.debug(`Heap push — new size: ${this.heap.length}`);
    this.bubbleUp(this.heap.length - 1);
  }

  /** Remove and return the minimum element — O(log n) */
  pop(): T | undefined {
    if (this.heap.length === 0) {
      logger.warn("pop() called on empty heap");
      return undefined;
    }
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    logger.debug(`Heap pop — new size: ${this.heap.length}`);
    return min;
  }

  /** Return all elements as an array (unsorted) */
  toArray(): T[] {
    return [...this.heap];
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      if (this.comparator(this.heap[index], this.heap[parentIdx]) < 0) {
        this.swap(index, parentIdx);
        index = parentIdx;
      } else {
        break;
      }
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (
        left < length &&
        this.comparator(this.heap[left], this.heap[smallest]) < 0
      ) {
        smallest = left;
      }
      if (
        right < length &&
        this.comparator(this.heap[right], this.heap[smallest]) < 0
      ) {
        smallest = right;
      }
      if (smallest !== index) {
        this.swap(index, smallest);
        index = smallest;
      } else {
        break;
      }
    }
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }
}
