import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as inventoryController from '../../controllers/inventory.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { stockAdjustmentValidator, paginationValidator } from '../../validators';

const router = Router();

router.use(authenticate);

router.get('/history', paginationValidator, validate, asyncHandler(inventoryController.getInventoryHistory));
router.get('/low-stock', asyncHandler(inventoryController.getLowStock));
router.get('/out-of-stock', asyncHandler(inventoryController.getOutOfStock));

// Only Admin/Manager can manually adjust stock
router.post('/adjust', authorize('ADMIN', 'MANAGER'), stockAdjustmentValidator, validate, asyncHandler(inventoryController.adjustStock));

export default router;
