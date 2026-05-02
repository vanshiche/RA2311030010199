/**
 * Next.js API Route — Notifications Proxy
 *
 * Proxies requests to the evaluation API server-side,
 * bypassing browser CORS restrictions.
 * Uses the server-side AuthManager to auto-refresh the JWT token.
 *
 * GET /api/notifications?page=1&limit=10&notification_type=Placement
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerToken } from "@/lib/authManager";
import { createLogger } from "@/lib/logger";

const logger = createLogger("NotificationsProxy", "api");

const UPSTREAM = "http://20.207.122.201/evaluation-service/notifications";

// Only these values are accepted by the evaluation API
const VALID_TYPES = new Set(["Placement", "Result", "Event"]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const upstream = new URL(UPSTREAM);

  // Forward query params; enforce limit between 5 and 10; strip invalid notification_type
  searchParams.forEach((value, key) => {
    if (key === "limit") {
      const parsedLimit = Number(value) || 10;
      upstream.searchParams.set(key, String(Math.min(10, Math.max(5, parsedLimit))));
    } else if (key === "notification_type") {
      // Only forward valid types — never forward "All" or unknown values
      if (VALID_TYPES.has(value)) {
        upstream.searchParams.set(key, value);
      } else {
        logger.warn("Stripped invalid notification_type from upstream request", { value });
      }
    } else {
      upstream.searchParams.set(key, value);
    }
  });

  // Ensure limit is always set
  if (!upstream.searchParams.has("limit")) {
    upstream.searchParams.set("limit", "10");
  }

  logger.info("Proxying notification request to evaluation API", {
    upstream: upstream.toString(),
  });

  try {
    const token = await getServerToken();

    const response = await fetch(upstream.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      logger.error("Upstream evaluation API returned error", {
        status: response.status,
        detail: text,
        upstream: upstream.toString(),
      });
      return NextResponse.json(
        { error: `Upstream error ${response.status}`, detail: text },
        { status: response.status }
      );
    }

    const data = await response.json();
    const count = Array.isArray((data as { notifications?: unknown[] }).notifications)
      ? (data as { notifications: unknown[] }).notifications.length
      : 0;

    logger.info("Proxy request successful", {
      upstream: upstream.toString(),
      notificationCount: count,
    });

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Proxy failed to reach evaluation API", { error: message });
    return NextResponse.json(
      { error: "Failed to reach evaluation API", detail: message },
      { status: 502 }
    );
  }
}
