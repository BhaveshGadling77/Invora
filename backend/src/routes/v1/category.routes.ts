import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as categoryController from '../../controllers/category.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { categoryValidator, idParamValidator, paginationValidator } from '../../validators';

const router = Router();

router.use(authenticate);

router.get('/', paginationValidator, validate, asyncHandler(categoryController.getAllCategories));
router.get('/:id', idParamValidator, validate, asyncHandler(categoryController.getCategoryById));

// Protected routes (Admin, Manager)
router.use(authorize('ADMIN', 'MANAGER'));
router.post('/', categoryValidator, validate, asyncHandler(categoryController.createCategory));
router.put('/:id', [...idParamValidator, ...categoryValidator], validate, asyncHandler(categoryController.updateCategory));
router.delete('/:id', idParamValidator, validate, asyncHandler(categoryController.deleteCategory));

export default router;
