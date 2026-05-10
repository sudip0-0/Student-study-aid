import { Request, Response, NextFunction } from "express";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUUID(value: string): boolean {
  return UUID_RE.test(value);
}

export function validateUUIDParam(...paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const name of paramNames) {
      const value = req.params[name];
      if (value && !isUUID(value)) {
        return res.status(400).json({ error: `Invalid ${name} format` });
      }
    }
    next();
  };
}
