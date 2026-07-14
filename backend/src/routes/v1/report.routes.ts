import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as reportController from '../../controllers/report.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Apply auth middleware to all report routes
router.use(authenticate);

router.get('/sales', asyncHandler(reportController.exportSales));
router.get('/inventory', asyncHandler(reportController.exportInventory));

export default router;
