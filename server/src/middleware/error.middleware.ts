import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

interface HttpError extends Error {
  statusCode?: number;
  expose?: boolean;
}

export function errorMiddleware(err: HttpError, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;
  if (statusCode >= 500 || !err.expose) {
    logger.error({ err, requestId: req.requestId }, "Request error");
  }
  res.status(statusCode).json({
    error: statusCode === 500 && !err.expose ? "Internal server error" : err.message,
  });
}
