const counters = {
  http_requests_total: 0,
  http_errors_total: 0,
  extraction_jobs_completed: 0,
  extraction_jobs_failed: 0,
  rate_limit_hits: 0,
};

export type MetricName = keyof typeof counters;

export function incr(name: MetricName, by = 1): void {
  counters[name] += by;
}

export function snapshot(): Record<MetricName, number> & { uptimeSeconds: number } {
  return {
    ...counters,
    uptimeSeconds: Math.floor(process.uptime()),
  };
}
