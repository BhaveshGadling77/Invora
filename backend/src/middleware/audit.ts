import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { logger } from '../utils/logger';

/**
 * Creates an audit log entry.
 * Called manually from service layer after significant operations.
 */
export const createAuditLog = async (
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
  oldValues?: object,
  newValues?: object,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValues: oldValues ? oldValues : undefined,
        newValues: newValues ? newValues : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Audit log failure should never crash the application
    logger.error('Failed to create audit log:', error);
  }
};

/**
 * Express middleware to attach audit helper to req for convenience.
 */
export const auditMiddleware = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void => {
  req.audit = (
    action: string,
    entity: string,
    entityId?: string,
    oldValues?: object,
    newValues?: object,
  ) => {
    if (req.user) {
      createAuditLog(
        req.user.id,
        action,
        entity,
        entityId,
        oldValues,
        newValues,
        req.ip,
        req.headers['user-agent'],
      );
    }
  };
  next();
};

// Extend Express Request type for audit helper
declare global {
  namespace Express {
    interface Request {
      audit?: (
        action: string,
        entity: string,
        entityId?: string,
        oldValues?: object,
        newValues?: object,
      ) => void;
    }
  }
}
