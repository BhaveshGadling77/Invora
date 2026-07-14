import crypto from 'crypto';
import { config } from '../config/config';

/**
 * Generates a cryptographically secure random token (hex string).
 * Used for email verification and password reset tokens.
 */
export const generateSecureToken = (bytes = 32): string =>
  crypto.randomBytes(bytes).toString('hex');

/**
 * Hashes a token for safe DB storage (so raw token never stored).
 */
export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

/**
 * Generates invoice number: INV-YYYYMMDD-XXXX
 */
export const generateInvoiceNumber = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${random}`;
};

/**
 * Generates purchase order number: PO-YYYYMMDD-XXXX
 */
export const generatePurchaseNumber = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PO-${dateStr}-${random}`;
};

/**
 * Generates SKU: INV-<CATEGORY_PREFIX>-<RANDOM>
 */
export const generateSKU = (categoryName: string): string => {
  const prefix = categoryName.slice(0, 3).toUpperCase();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${random}`;
};

/**
 * Formats currency with Indian locale
 */
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

/**
 * Token expiry date helper
 */
export const getExpiryDate = (minutes: number): Date => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};
