/**
 * Auth Manager — Campus Notifications System
 *
 * Handles automatic JWT token acquisition and refresh.
 * Tokens expire every ~15 minutes; this module refreshes 60s before expiry.
 *
 * Credentials: vv0740@srmist.edu.in / clientID: 8be2f6ea-...
 */

import { createLogger } from "../../logging_middleware/index";

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

// Refresh 60 seconds before expiry
const REFRESH_BUFFER_SECONDS = 60;

interface TokenState {
  token: string;
  expiresAt: number; // Unix timestamp in seconds
  refreshTimer?: ReturnType<typeof setTimeout>;
}

let tokenState: TokenState | null = null;

/**
 * Fetch a fresh JWT from the /auth endpoint.
 */
async function fetchFreshToken(): Promise<TokenState> {
  logger.info("Requesting fresh JWT from auth endpoint");

  const response = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CREDENTIALS),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    logger.error("Auth request failed", { status: response.status, body });
    throw new Error(`Auth failed: ${response.status} — ${body}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  logger.info("JWT obtained successfully", {
    expiresAt: new Date(data.expires_in * 1000).toISOString(),
    tokenType: data.token_type,
  });

  return {
    token: data.access_token,
    expiresAt: data.expires_in,
  };
}

/**
 * Schedule a proactive refresh before token expiry.
 */
function scheduleRefresh(state: TokenState): void {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const secondsUntilExpiry = state.expiresAt - nowSeconds;
  const refreshInMs = Math.max(
    (secondsUntilExpiry - REFRESH_BUFFER_SECONDS) * 1000,
    5000 // minimum 5s
  );

  logger.info("Token refresh scheduled", {
    expiresIn: `${secondsUntilExpiry}s`,
    refreshIn: `${Math.round(refreshInMs / 1000)}s`,
  });

  if (state.refreshTimer) clearTimeout(state.refreshTimer);

  state.refreshTimer = setTimeout(async () => {
    logger.info("Proactive token refresh triggered");
    try {
      const fresh = await fetchFreshToken();
      scheduleRefresh(fresh);
      tokenState = fresh;
    } catch (err) {
      logger.error("Proactive token refresh failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, refreshInMs);

  // Don't keep Node process alive just for this timer
  if (state.refreshTimer?.unref) state.refreshTimer.unref();
}

/**
 * Get a valid Bearer token. Fetches on first call; auto-refreshes before expiry.
 */
export async function getToken(): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000);

  // Return cached token if still valid
  if (tokenState && tokenState.expiresAt > nowSeconds + REFRESH_BUFFER_SECONDS) {
    logger.debug("Using cached JWT", {
      validFor: `${tokenState.expiresAt - nowSeconds}s`,
    });
    return tokenState.token;
  }

  // Fetch fresh token
  const fresh = await fetchFreshToken();
  scheduleRefresh(fresh);
  tokenState = fresh;
  return tokenState.token;
}
