// Global type augmentations and shared interfaces for Inventra

import { Request } from 'express';
import { Role } from '@prisma/client';

// ─── Authenticated Request ────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// ─── API Response Envelope ────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: ValidationError[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  name: string;
  iat?: number;
  exp?: number;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  totalProducts: number;
  inventoryValue: number;
  totalCategories: number;
  totalSuppliers: number;
  totalSales: number;
  monthlyRevenue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

// ─── Report Types ─────────────────────────────────────────────────────────────
export type ReportFormat = 'json' | 'csv' | 'excel' | 'pdf';
export type ReportType = 'sales' | 'purchase' | 'inventory' | 'profit';
