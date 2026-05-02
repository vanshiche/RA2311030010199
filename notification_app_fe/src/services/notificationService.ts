/**
 * Notification Service — Frontend API Client
 *
 * Calls the local Next.js proxy route (/api/notifications) which
 * forwards to the evaluation API server-side, avoiding
 * browser CORS restrictions.
 *
 * Performance strategy:
 * - Fetch page 1 immediately (fast first render)
 * - Fetch pages 2..MAX_PAGES in parallel
 * - Total: 2 round-trips instead of N sequential calls
 *
 * API constraints: limit must be 5–10. Max limit = 10.
 */

import { ApiResponse, FetchParams, Notification } from "@/types/notification";
import { createLogger } from "@/lib/logger";

const logger = createLogger("NotificationService", "api");

const PROXY_ENDPOINT = "/api/notifications";
const VALID_TYPES = new Set(["Placement", "Result", "Event"]);

// Fetch at most this many pages total (50 items max — more than enough for UI + priority)
const MAX_PAGES = 5;
const PAGE_LIMIT = 10; // API max limit

/**
 * Fetch a single page from the proxy. Returns [] on any error.
 */
async function fetchPage(
  page: number,
  limit: number,
  notification_type?: string
): Promise<Notification[]> {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(limit));
  if (notification_type && VALID_TYPES.has(notification_type)) {
    query.set("notification_type", notification_type);
  }

  const url = `${PROXY_ENDPOINT}?${query}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: response.statusText }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw new Error((errBody as any)?.error ?? `API Error ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    return Array.isArray(data?.notifications) ? data.notifications : [];
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  }
}

/**
 * Fetch notifications via the local API proxy.
 *
 * Strategy: fetch page 1, then fetch pages 2..MAX_PAGES in parallel.
 * Total latency ≈ max(page1, max(pages 2..N)) instead of sum(pages 1..N).
 */
export async function fetchNotifications(
  params: FetchParams = {}
): Promise<Notification[]> {
  const limit = PAGE_LIMIT;
  const typeFilter = params.notification_type;

  logger.info("Fetching notifications (parallel strategy)", {
    maxPages: MAX_PAGES,
    limit,
    typeFilter,
  });

  // Fetch page 1 first — if it returns < limit items, no more pages exist
  const firstPage = await fetchPage(1, limit, typeFilter);

  logger.info("Page 1 fetched", { count: firstPage.length });

  // If page 1 is not full, there's no more data
  if (firstPage.length < limit) {
    logger.info("All data retrieved in page 1", { total: firstPage.length });
    return firstPage;
  }

  // Fetch remaining pages in parallel
  const remainingPageNums = Array.from(
    { length: MAX_PAGES - 1 },
    (_, i) => i + 2
  );

  const remainingPages = await Promise.all(
    remainingPageNums.map((page) => fetchPage(page, limit, typeFilter))
  );

  const allNotifications = [
    ...firstPage,
    ...remainingPages.flat().filter((n) => n !== null),
  ];

  logger.info("All pages fetched successfully", {
    total: allNotifications.length,
    pages: MAX_PAGES,
  });

  return allNotifications;
}
