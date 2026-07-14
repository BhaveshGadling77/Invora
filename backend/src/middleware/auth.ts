import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { JwtPayload, AuthRequest } from '../types';
import { UnauthorizedError, ForbiddenError, asyncHandler } from './errorHandler';
import prisma from '../config/database';
import { Role } from '@prisma/client';

/**
 * Verifies access token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
export const authenticate = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, role: true, name: true, status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account not found or inactive');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  },
);

/**
 * Role-based access control middleware factory.
 * Usage: authorize('ADMIN', 'MANAGER')
 */
export const authorize = (...roles: Role[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Required roles: ${roles.join(', ')}`,
      );
    }
    next();
  };

/**
 * Optional authentication — attaches user if token present, doesn't fail if not.
 */
export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
};
