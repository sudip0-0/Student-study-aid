import { incr, snapshot } from "../lib/metrics";

/** Lightweight request metrics middleware. */
export function metricsMiddleware(req: { path?: string; url?: string }, _res: unknown, next: () => void) {
  const path = req.path || req.url || "";
  if (!path.startsWith("/api/metrics")) {
    incr("http_requests_total");
  }
  next();
}

export function recordHttpError() {
  incr("http_errors_total");
}

export function metricsSnapshot() {
  return snapshot();
}
