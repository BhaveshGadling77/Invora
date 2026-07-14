import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as productController from '../../controllers/product.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { productValidator, idParamValidator, paginationValidator } from '../../validators';
import { uploadImage } from '../../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', paginationValidator, validate, asyncHandler(productController.getAllProducts));
router.get('/:id', idParamValidator, validate, asyncHandler(productController.getProductById));

router.use(authorize('ADMIN', 'MANAGER'));
router.post('/', uploadImage, productValidator, validate, asyncHandler(productController.createProduct));
router.put('/:id', uploadImage, [...idParamValidator, ...productValidator], validate, asyncHandler(productController.updateProduct));
router.delete('/:id', idParamValidator, validate, asyncHandler(productController.deleteProduct));

export default router;
