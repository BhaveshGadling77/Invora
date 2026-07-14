import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

// Custom application error class with HTTP status code
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 422);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

// ─── Global Error Handler Middleware ──────────────────────────────────────────

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Operational (expected) errors
  if (err instanceof AppError) {
    logger.warn(`[${err.statusCode}] ${err.message}`);
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Prisma unique constraint violation
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'field';
      sendError(res, `A record with this ${field} already exists`, 409);
      return;
    }
    if (prismaError.code === 'P2025') {
      sendError(res, 'Record not found', 404);
      return;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 401);
    return;
  }
  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 401);
    return;
  }

  // Multer file size error
  if (err.name === 'MulterError') {
    const multerErr = err as { code: string };
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'File size too large. Max 5MB allowed.', 400);
      return;
    }
  }

  // Unhandled errors - log and return generic message
  logger.error('Unhandled error:', err);
  sendError(res, 'Internal server error', 500);
};

// ─── 404 Handler ─────────────────────────────────────────────────────────────

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
};

// ─── Async Handler Wrapper ────────────────────────────────────────────────────
// Eliminates try/catch boilerplate in controllers

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler =
  (fn: AsyncFn) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
