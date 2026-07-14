import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as supplierController from '../../controllers/supplier.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { supplierValidator, idParamValidator, paginationValidator } from '../../validators';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER')); // Suppliers managed by Admin/Manager

router.get('/', paginationValidator, validate, asyncHandler(supplierController.getAllSuppliers));
router.get('/:id', idParamValidator, validate, asyncHandler(supplierController.getSupplierById));
router.post('/', supplierValidator, validate, asyncHandler(supplierController.createSupplier));
router.put('/:id', [...idParamValidator, ...supplierValidator], validate, asyncHandler(supplierController.updateSupplier));
router.delete('/:id', idParamValidator, validate, asyncHandler(supplierController.deleteSupplier));

export default router;
