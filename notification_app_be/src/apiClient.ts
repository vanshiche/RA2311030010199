/**
 * API Client — Campus Notifications System
 *
 * Fetches notifications from the evaluation service.
 * Uses AuthManager for automatic JWT refresh.
 *
 * Performance strategy:
 * - Fetch page 1 first; if full, fetch remaining pages in parallel
 * - API constraints: limit 5–10 per page
 *
 * GET http://20.207.122.201/evaluation-service/notifications
 */

import { ApiResponse, Notification } from "./types";
import { createLogger } from "../../logging_middleware/index";
import { getToken } from "./authManager";

const logger = createLogger("ApiClient", "service");

const API_BASE_URL = "http://20.207.122.201/evaluation-service";
const NOTIFICATIONS_ENDPOINT = `${API_BASE_URL}/notifications`;
const REQUEST_TIMEOUT_MS = 15_000;

const PAGE_LIMIT = 10;   // API max per page
const MAX_PAGES = 5;     // Fetch at most 5 pages = 50 notifications

// ─── Single-page fetcher ──────────────────────────────────────────────────────

async function fetchPage(
  page: number,
  limit: number,
  notification_type?: string
): Promise<Notification[]> {
  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(Math.min(10, Math.max(5, limit))));
  if (notification_type) {
    queryParams.set("notification_type", notification_type);
  }

  const url = `${NOTIFICATIONS_ENDPOINT}?${queryParams.toString()}`;
  logger.info(`Fetching page ${page}`, { url });

  const token = await getToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "(unreadable)");
      logger.error(`Page ${page} failed`, { status: response.status, errorBody });
      throw new Error(`API error: ${response.status} ${response.statusText} — ${errorBody}`);
    }

    const data = (await response.json()) as ApiResponse;

    if (!data.notifications || !Array.isArray(data.notifications)) {
      throw new Error("API response missing 'notifications' array");
    }

    logger.debug(`Page ${page} fetched`, { count: data.notifications.length });
    return data.notifications;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request timed out: ${url}`);
    }
    throw err;
  }
}

// ─── Public fetcher ───────────────────────────────────────────────────────────

/**
 * Fetch all notifications using a parallel strategy:
 * - Fetch page 1 first
 * - If page 1 is full, fetch pages 2..MAX_PAGES in parallel
 * - Total latency ≈ 2 round-trips instead of MAX_PAGES sequential calls
 */
export async function fetchNotifications(params?: {
  page?: number;
  limit?: number;
  notification_type?: string;
}): Promise<Notification[]> {
  const limit = PAGE_LIMIT;
  const typeFilter = params?.notification_type;

  logger.info("Starting parallel notification fetch", { maxPages: MAX_PAGES, limit });

  // Step 1: Fetch page 1
  const firstPage = await fetchPage(1, limit, typeFilter);
  logger.info("Page 1 complete", { count: firstPage.length });

  // If page 1 isn't full, we have all the data
  if (firstPage.length < limit) {
    logger.info("Fetch complete (single page)", { total: firstPage.length });
    return firstPage;
  }

  // Step 2: Fetch remaining pages in parallel
  const remainingPageNums = Array.from({ length: MAX_PAGES - 1 }, (_, i) => i + 2);

  logger.info(`Fetching pages 2–${MAX_PAGES} in parallel`);

  const remainingPages = await Promise.all(
    remainingPageNums.map((page) =>
      fetchPage(page, limit, typeFilter).catch((err) => {
        logger.warn(`Page ${page} failed, skipping`, {
          error: err instanceof Error ? err.message : String(err),
        });
        return [] as Notification[];
      })
    )
  );

  const allNotifications = [firstPage, ...remainingPages].flat();

  logger.info("Fetch complete", {
    total: allNotifications.length,
    pages: MAX_PAGES,
  });

  return allNotifications;
}
