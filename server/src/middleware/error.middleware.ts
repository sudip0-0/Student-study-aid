import { Request, Response, NextFunction } from "express";

interface HttpError extends Error {
  statusCode?: number;
  expose?: boolean;
}

export function errorMiddleware(err: HttpError, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;
  res.status(statusCode).json({ error: statusCode === 500 && !err.expose ? "Internal server error" : err.message });
}
