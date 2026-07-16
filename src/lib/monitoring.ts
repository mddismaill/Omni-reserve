// Lightweight client-side error monitoring & performance reporting.
// Batches log entries and POSTs them to /api/logs. Never throws.

type LogLevel = "error" | "warn" | "info" | "perf";

interface LogEntry {
  level: LogLevel;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

const queue: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_QUEUE = 50;
const FLUSH_MS = 2000;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, FLUSH_MS);
}

async function flush() {
  flushTimer = null;
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  try {
    await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: batch }),
      keepalive: true,
    });
  } catch {
    // Drop on failure — avoid infinite loops.
  }
}

function enqueue(entry: LogEntry) {
  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push(entry);
  if (entry.level === "error") {
    // Flush errors quickly.
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    void flush();
  } else {
    scheduleFlush();
  }
}

export function reportError(err: unknown, context?: Record<string, unknown>) {
  const e = err instanceof Error ? err : new Error(String(err));
  enqueue({
    level: "error",
    message: e.message,
    stack: e.stack,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    timestamp: new Date().toISOString(),
    context,
  });
}

export function reportInfo(message: string, context?: Record<string, unknown>) {
  enqueue({
    level: "info",
    message,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    timestamp: new Date().toISOString(),
    context,
  });
}

function reportPerf(message: string, context: Record<string, unknown>) {
  enqueue({
    level: "perf",
    message,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    timestamp: new Date().toISOString(),
    context,
  });
}

let installed = false;

export function installMonitoring() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    reportError(event.error ?? event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason ?? "Unhandled promise rejection", {
      kind: "unhandledrejection",
    });
  });

  // Page load performance metrics.
  window.addEventListener("load", () => {
    setTimeout(() => {
      try {
        const nav = performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined;
        if (!nav) return;
        reportPerf("page_load", {
          durationMs: Math.round(nav.duration),
          domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
          loadEventMs: Math.round(nav.loadEventEnd - nav.startTime),
          transferSize: nav.transferSize,
          type: nav.type,
        });
      } catch {
        /* ignore */
      }
    }, 0);
  });

  // Flush on tab close.
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });

  // Track slow API requests via fetch wrapper.
  const orig = window.fetch.bind(window);
  const monitoredFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const start = performance.now();
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const isApi = url.includes("/api/");
    try {
      const res = await orig(input, init);
      if (isApi) {
        const dur = performance.now() - start;
        if (dur > 1500 || res.status >= 500) {
          reportPerf("slow_or_failed_api", {
            url,
            status: res.status,
            durationMs: Math.round(dur),
          });
        }
      }
      return res;
    } catch (err) {
      if (isApi) reportError(err, { url, kind: "fetch_failed" });
      throw err;
    }
  };

  const desc = Object.getOwnPropertyDescriptor(window, "fetch");
  const isWritable = !desc || desc.writable || desc.set || desc.configurable;

  if (isWritable) {
    try {
      Object.defineProperty(window, "fetch", {
        value: monitoredFetch,
        configurable: true,
        writable: true,
        enumerable: true,
      });
    } catch (e) {
      try {
        window.fetch = monitoredFetch;
      } catch (err) {
        console.error("Failed to redefine window.fetch in monitoring:", err);
      }
    }
  } else {
    console.warn("window.fetch is read-only and non-configurable. Skipping monitored fetch override.");
  }
}
