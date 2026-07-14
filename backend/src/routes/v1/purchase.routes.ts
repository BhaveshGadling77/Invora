import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as purchaseController from '../../controllers/purchase.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { purchaseValidator, idParamValidator, paginationValidator } from '../../validators';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER')); // Only managers/admins can handle purchases

router.get('/', paginationValidator, validate, asyncHandler(purchaseController.getAllPurchases));
router.get('/:id', idParamValidator, validate, asyncHandler(purchaseController.getPurchaseById));
router.post('/', purchaseValidator, validate, asyncHandler(purchaseController.createPurchase));

export default router;
