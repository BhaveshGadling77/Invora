import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import * as dashboardController from '../../controllers/dashboard.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', asyncHandler(dashboardController.getDashboardStats));
router.get('/monthly-sales', asyncHandler(dashboardController.getMonthlySales));
router.get('/recent-activities', asyncHandler(dashboardController.getRecentActivities));
router.get('/top-selling', asyncHandler(dashboardController.getTopSelling));

export default router;
