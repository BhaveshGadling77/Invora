import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as saleController from '../../controllers/sale.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { saleValidator, idParamValidator, paginationValidator } from '../../validators';

const router = Router();

router.use(authenticate);

router.get('/', paginationValidator, validate, asyncHandler(saleController.getAllSales));
router.get('/:id', idParamValidator, validate, asyncHandler(saleController.getSaleById));
router.post('/', saleValidator, validate, asyncHandler(saleController.createSale)); // Staff can create sales

export default router;
