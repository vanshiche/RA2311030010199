/**
 * Logging Middleware — Campus Notifications System
 * Project Campus Hiring Evaluation
 *
 * Sends structured logs to POST /evaluation-service/logs AND writes locally.
 * Package values are strictly constrained to evaluation API accepted values.
 * Token is auto-refreshed before expiry — never fails due to JWT expiry.
 *
 * Log(stack, level, package, message)
 */

// ─── Valid types per evaluation API spec ─────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogStack = "backend" | "frontend";

export type BackendPackage =
  | "cache" | "controller" | "cron_job" | "db" | "domain"
  | "handler" | "repository" | "route" | "service";

export type FrontendPackage =
  | "api" | "component" | "hook" | "page" | "state" | "style";

export type SharedPackage = "auth" | "config" | "middleware" | "utils";

export type ValidPackage = BackendPackage | FrontendPackage | SharedPackage;

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  package: ValidPackage;
  message: string;
  data?: unknown;
  stack: LogStack;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const LOG_API_URL    = "http://20.207.122.201/evaluation-service/logs";
const AUTH_API_URL   = "http://20.207.122.201/evaluation-service/auth";
const REFRESH_BUFFER = 60; // seconds before expiry to refresh

const CREDENTIALS = {
  email: "vv0740@srmist.edu.in",
  name: "Vansh Vinay Chugh",
  rollNo: "VV0740",
  accessCode: "QkbpxH",
  clientID: "8be2f6ea-de4f-482c-9a91-b1985c3e1635",
  clientSecret: "NqvXNsqbbvmxgAtD",
};

// ─── Token cache ─────────────────────────────────────────────────────────────

let _token: string | null = null;
let _expiresAt = 0; // Unix seconds
let _tokenPromise: Promise<string> | null = null;

async function _fetchToken(): Promise<string> {
  try {
    const res = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(CREDENTIALS),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { access_token: string; expires_in: number };
    _token = data.access_token;
    _expiresAt = data.expires_in;
    return _token;
  } catch {
    return _token ?? "";
  }
}

async function getToken(): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  if (_token && _expiresAt > nowSec + REFRESH_BUFFER) return _token;
  if (!_tokenPromise) {
    _tokenPromise = _fetchToken().finally(() => { _tokenPromise = null; });
  }
  return _tokenPromise;
}

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3, fatal: 4,
};

const MIN_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || "debug";

// ─── API Sender (fire-and-forget) ─────────────────────────────────────────────

function sendToLogApi(
  stack: LogStack,
  level: LogLevel,
  pkg: ValidPackage,
  message: string
): void {
  getToken().then((token) => {
    if (!token) return;
    return fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stack, level, package: pkg, message }),
    });
  }).catch(() => { /* never crash the app */ });
}

// ─── Local formatter ──────────────────────────────────────────────────────────

function formatLocal(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase().padEnd(5)}] [${entry.package}/${entry.module}] ${entry.message}`;
  if (entry.data !== undefined) {
    const dataStr = typeof entry.data === "string"
      ? entry.data
      : JSON.stringify(entry.data, null, 2);
    return `${base}\n  ↳ ${dataStr}\n`;
  }
  return `${base}\n`;
}

// ─── Logger Class ─────────────────────────────────────────────────────────────

export class Logger {
  private readonly module: string;
  private readonly pkg: ValidPackage;
  private readonly stack: LogStack;

  constructor(module: string, pkg: ValidPackage, stack: LogStack = "backend") {
    this.module = module;
    this.pkg = pkg;
    this.stack = stack;
  }

  private write(level: LogLevel, message: string, data?: unknown): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level, module: this.module,
      package: this.pkg, message, data,
      stack: this.stack,
    };

    const formatted = formatLocal(entry);
    if (level === "error" || level === "fatal") {
      process.stderr.write(formatted);
    } else {
      process.stdout.write(formatted);
    }

    sendToLogApi(this.stack, level, this.pkg, message);
  }

  info(message: string, data?: unknown): void  { this.write("info",  message, data); }
  debug(message: string, data?: unknown): void  { this.write("debug", message, data); }
  warn(message: string, data?: unknown): void   { this.write("warn",  message, data); }
  error(message: string, data?: unknown): void  { this.write("error", message, data); }
  fatal(message: string, data?: unknown): void  { this.write("fatal", message, data); }
}

// ─── Standalone Log (spec signature) ──────────────────────────────────────────

export async function Log(
  stack: LogStack,
  level: LogLevel,
  pkg: ValidPackage,
  message: string
): Promise<void> {
  const formatted = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${pkg}] ${message}\n`;
  if (level === "error" || level === "fatal") {
    process.stderr.write(formatted);
  } else {
    process.stdout.write(formatted);
  }
  const token = await getToken();
  if (!token) return;
  await fetch(LOG_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ stack, level, package: pkg, message }),
  }).catch(() => {});
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLogger(
  module: string,
  pkg: ValidPackage,
  stack: LogStack = "backend"
): Logger {
  return new Logger(module, pkg, stack);
}
