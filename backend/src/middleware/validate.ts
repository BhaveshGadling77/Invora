import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/response';

/**
 * Middleware that reads express-validator results and returns 422 if invalid.
 * Place after your validation chain in routes.
 */
export const validate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.type === 'field' ? err.path : 'unknown',
      message: err.msg as string,
    }));
    sendError(res, 'Validation failed', 422, formatted);
    return;
  }
  next();
};
