import { Router } from 'express';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import supplierRoutes from './supplier.routes';
import customerRoutes from './customer.routes';
import productRoutes from './product.routes';
import purchaseRoutes from './purchase.routes';
import saleRoutes from './sale.routes';
import inventoryRoutes from './inventory.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/sales', saleRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

export default router;
