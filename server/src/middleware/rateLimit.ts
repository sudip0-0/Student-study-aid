import { Request, Response, NextFunction } from "express";
import { Ratelimit } from "@upstash/ratelimit";
import { getRedis, isRedisConfigured } from "../lib/redis";
import { logger } from "../lib/logger";

type LimiterKind = "auth" | "ai" | "upload";

const limiters = new Map<LimiterKind, Ratelimit>();

function getLimiter(kind: LimiterKind): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  let limiter = limiters.get(kind);
  if (limiter) return limiter;

  const configs: Record<LimiterKind, { tokens: number; window: `${number} s` }> = {
    auth: { tokens: 20, window: "60 s" },
    ai: { tokens: 30, window: "60 s" },
    upload: { tokens: 15, window: "60 s" },
  };
  const cfg = configs[kind];
  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.tokens, cfg.window),
    prefix: `lumio:rl:${kind}`,
  });
  limiters.set(kind, limiter);
  return limiter;
}

function clientKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.ip || "unknown";
}

export function rateLimitMiddleware(kind: LimiterKind) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const limiter = getLimiter(kind);
    if (!limiter) {
      if (process.env.NODE_ENV === "production" && isRedisConfigured() === false) {
        // Production without Redis: fail closed for expensive routes
        if (kind === "ai" || kind === "auth") {
          logger.error({ kind }, "Rate limiter unavailable in production");
          return res.status(503).json({ error: "Service temporarily unavailable" });
        }
      }
      return next();
    }

    try {
      const result = await limiter.limit(clientKey(req));
      res.setHeader("X-RateLimit-Limit", String(result.limit));
      res.setHeader("X-RateLimit-Remaining", String(result.remaining));
      if (!result.success) {
        return res.status(429).json({ error: "Too many requests, try again later." });
      }
      next();
    } catch (err) {
      logger.error({ err, kind }, "Rate limit check failed");
      if (process.env.NODE_ENV === "production" && (kind === "ai" || kind === "auth")) {
        return res.status(503).json({ error: "Service temporarily unavailable" });
      }
      next();
    }
  };
}
