import { body, param, query } from 'express-validator';

// ─── Auth Validators ──────────────────────────────────────────────────────────

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and number'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'MANAGER', 'STAFF'])
    .withMessage('Invalid role'),
];

export const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and number'),
];

// ─── Category Validators ──────────────────────────────────────────────────────

export const categoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid hex color'),
  body('icon').optional().trim().isLength({ max: 50 }),
];

// ─── Supplier Validators ──────────────────────────────────────────────────────

export const supplierValidator = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('contactPerson').trim().notEmpty().withMessage('Contact person is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required').isMobilePhone('any'),
  body('gstNumber').optional().trim(),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('pincode').optional().trim(),
];

// ─── Customer Validators ──────────────────────────────────────────────────────

export const customerValidator = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('gstNumber').optional().trim(),
  body('address').optional().trim(),
];

// ─── Product Validators ───────────────────────────────────────────────────────

export const productValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required').isLength({ max: 200 }),
  body('sku').optional().trim().isLength({ max: 50 }),
  body('barcode').optional().trim(),
  body('categoryId').notEmpty().withMessage('Category is required').isUUID(),
  body('supplierId').optional().isUUID(),
  body('purchasePrice')
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),
  body('sellingPrice')
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),
  body('currentStock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('minimumStock').isInt({ min: 0 }).withMessage('Minimum stock must be a non-negative integer'),
  body('unit').trim().notEmpty().withMessage('Unit is required'),
  body('tax').optional().isFloat({ min: 0, max: 100 }),
  body('discount').optional().isFloat({ min: 0, max: 100 }),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'DISCONTINUED']),
];

// ─── Purchase Validators ──────────────────────────────────────────────────────

export const purchaseValidator = [
  body('supplierId').notEmpty().isUUID().withMessage('Valid supplier is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isUUID().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be positive'),
  body('notes').optional().trim(),
];

// ─── Sale Validators ──────────────────────────────────────────────────────────

export const saleValidator = [
  body('customerId').optional().isUUID(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isUUID().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be positive'),
  body('items.*.discount').optional().isFloat({ min: 0, max: 100 }),
  body('paymentMethod').isIn(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER']).withMessage('Invalid payment method'),
  body('amountPaid').isFloat({ min: 0 }).withMessage('Amount paid must be positive'),
  body('notes').optional().trim(),
];

// ─── Stock Adjustment Validators ──────────────────────────────────────────────

export const stockAdjustmentValidator = [
  body('productId').notEmpty().isUUID().withMessage('Valid product is required'),
  body('type').isIn(['ADD', 'REMOVE', 'DAMAGE', 'RETURN', 'CORRECTION']).withMessage('Invalid adjustment type'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('reason').trim().notEmpty().withMessage('Reason is required').isLength({ max: 500 }),
];

// ─── Pagination Validators ────────────────────────────────────────────────────

export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim().escape(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];

// ─── ID Param Validator ───────────────────────────────────────────────────────

export const idParamValidator = [
  param('id').isUUID().withMessage('Invalid ID format'),
];
