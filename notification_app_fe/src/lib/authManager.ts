/**
 * Server-side Auth Manager — Next.js Frontend
 *
 * Caches a valid JWT in module memory and auto-refreshes before expiry.
 * Runs server-side only (Next.js API routes / Server Components).
 */

import { createLogger } from "@/lib/logger";

const logger = createLogger("AuthManager", "auth");

const AUTH_URL = "http://20.207.122.201/evaluation-service/auth";
const CREDENTIALS = {
  email: "vv0740@srmist.edu.in",
  name: "Vansh Vinay Chugh",
  rollNo: "VV0740",
  accessCode: "QkbpxH",
  clientID: "8be2f6ea-de4f-482c-9a91-b1985c3e1635",
  clientSecret: "NqvXNsqbbvmxgAtD",
};
const REFRESH_BUFFER_SECONDS = 60;

interface TokenCache {
  token: string;
  expiresAt: number; // Unix seconds
}

// Module-level cache — persists across requests in the same server process
let cache: TokenCache | null = null;
let inFlight: Promise<TokenCache> | null = null;

async function fetchFreshToken(): Promise<TokenCache> {
  logger.info("Fetching fresh JWT from evaluation auth API");
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CREDENTIALS),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.error("Auth token fetch failed", { status: res.status, body });
    throw new Error(`Auth failed ${res.status}: ${body}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  logger.info("JWT token acquired successfully", { expiresAt: data.expires_in });
  return { token: data.access_token, expiresAt: data.expires_in };
}

export async function getServerToken(): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);

  if (cache && cache.expiresAt > nowSec + REFRESH_BUFFER_SECONDS) {
    logger.debug("Using cached server JWT", {
      validFor: `${cache.expiresAt - nowSec}s`,
    });
    return cache.token;
  }

  logger.info("Server JWT expired or missing — refreshing");

  // Deduplicate concurrent refresh calls
  if (!inFlight) {
    inFlight = fetchFreshToken().finally(() => { inFlight = null; });
  }

  cache = await inFlight;
  return cache.token;
}
