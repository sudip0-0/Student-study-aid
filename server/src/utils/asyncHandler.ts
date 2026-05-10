import { Request, Response, NextFunction } from "express";

export function asyncHandler<TReq extends Request = Request>(
  fn: (req: TReq, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: TReq, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
