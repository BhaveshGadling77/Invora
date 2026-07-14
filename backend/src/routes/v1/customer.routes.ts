import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as customerController from '../../controllers/customer.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { customerValidator, idParamValidator, paginationValidator } from '../../validators';

const router = Router();

router.use(authenticate);

router.get('/', paginationValidator, validate, asyncHandler(customerController.getAllCustomers));
router.get('/:id', idParamValidator, validate, asyncHandler(customerController.getCustomerById));
router.post('/', customerValidator, validate, asyncHandler(customerController.createCustomer));
router.put('/:id', [...idParamValidator, ...customerValidator], validate, asyncHandler(customerController.updateCustomer));
router.delete('/:id', idParamValidator, validate, asyncHandler(customerController.deleteCustomer));

export default router;
