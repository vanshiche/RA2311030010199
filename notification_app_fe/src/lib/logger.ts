/**
 * Browser-safe Logger — Campus Notifications System (Frontend)
 *
 * Sends logs to POST /evaluation-service/logs (stack: "frontend").
 * Auto-refreshes the JWT before expiry — token never expires mid-session.
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type FrontendPackage = "api" | "component" | "hook" | "page" | "state" | "style";
export type SharedPackage = "auth" | "config" | "middleware" | "utils";
export type ValidPackage = FrontendPackage | SharedPackage;

const LOG_API_URL  = "http://20.207.122.201/evaluation-service/logs";
const AUTH_API_URL = "http://20.207.122.201/evaluation-service/auth";
const REFRESH_BUFFER = 60; // seconds before expiry to refresh

const CREDENTIALS = {
  email: "vv0740@srmist.edu.in",
  name: "Vansh Vinay Chugh",
  rollNo: "VV0740",
  accessCode: "QkbpxH",
  clientID: "8be2f6ea-de4f-482c-9a91-b1985c3e1635",
  clientSecret: "NqvXNsqbbvmxgAtD",
};

// ─── Token cache (browser module-level) ──────────────────────────────────────

let _token: string | null = null;
let _expiresAt = 0;
let _tokenPromise: Promise<string> | null = null;

async function _fetchToken(): Promise<string> {
  try {
    const res = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(CREDENTIALS),
    });
    if (!res.ok) return _token ?? "";
    const data = (await res.json()) as { access_token: string; expires_in: number };
    _token = data.access_token;
    _expiresAt = data.expires_in;
    return _token;
  } catch {
    return _token ?? "";
  }
}

function getToken(): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  if (_token && _expiresAt > nowSec + REFRESH_BUFFER) return Promise.resolve(_token);
  if (!_tokenPromise) {
    _tokenPromise = _fetchToken().finally(() => { _tokenPromise = null; });
  }
  return _tokenPromise;
}

// ─── Log sender ────────────────────────────────────────────────────────────────

function sendToLogApi(level: LogLevel, pkg: ValidPackage, message: string): void {
  getToken().then((token) => {
    if (!token) return;
    return fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stack: "frontend", level, package: pkg, message }),
    });
  }).catch(() => {/* never crash the app */});
}

// ─── Styling ──────────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: "color: #60a5fa; font-weight: bold;",
  info:  "color: #4ade80; font-weight: bold;",
  warn:  "color: #fb923c; font-weight: bold;",
  error: "color: #f87171; font-weight: bold;",
  fatal: "color: #e879f9; font-weight: bold;",
};

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3, fatal: 4,
};

const MIN_LEVEL: LogLevel =
  (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

// ─── Logger class ─────────────────────────────────────────────────────────────

export class BrowserLogger {
  private readonly module: string;
  private readonly pkg: ValidPackage;

  constructor(module: string, pkg: ValidPackage) {
    this.module = module;
    this.pkg = pkg;
  }

  private write(level: LogLevel, message: string, data?: unknown): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;

    const prefix = `%c[${new Date().toISOString()}] [${level.toUpperCase()}] [${this.pkg}/${this.module}]`;
    const style = LEVEL_STYLES[level];

    if (data !== undefined) {
      // eslint-disable-next-line no-console
      console.groupCollapsed(prefix + ` ${message}`, style);
      // eslint-disable-next-line no-console
      console.dir(data);
      // eslint-disable-next-line no-console
      console.groupEnd();
    } else {
      // eslint-disable-next-line no-console
      console.log(prefix + ` ${message}`, style);
    }

    sendToLogApi(level, this.pkg, message);
  }

  info(message: string, data?: unknown): void  { this.write("info",  message, data); }
  debug(message: string, data?: unknown): void  { this.write("debug", message, data); }
  warn(message: string, data?: unknown): void   { this.write("warn",  message, data); }
  error(message: string, data?: unknown): void  { this.write("error", message, data); }
  fatal(message: string, data?: unknown): void  { this.write("fatal", message, data); }
}

export function createLogger(module: string, pkg: ValidPackage): BrowserLogger {
  return new BrowserLogger(module, pkg);
}
