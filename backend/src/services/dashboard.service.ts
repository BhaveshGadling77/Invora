import prisma from '../config/database';
import { DashboardStats } from '../types';

export class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const [
      totalProducts,
      totalCategories,
      totalSuppliers,
      totalSalesCount,
      inventoryAggr,
      lowStockCount,
      outOfStockCount,
      revenueAggr
    ] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.supplier.count(),
      prisma.sale.count(),
      
      // Inventory Value
      prisma.product.findMany({
        select: { currentStock: true, purchasePrice: true }
      }).then(products => 
        products.reduce((sum, p) => sum + (p.currentStock * Number(p.purchasePrice)), 0)
      ),

      prisma.product.count({ where: { stockStatus: 'LOW_STOCK' } }),
      prisma.product.count({ where: { stockStatus: 'OUT_OF_STOCK' } }),

      // Monthly Revenue (Current Month)
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    return {
      totalProducts,
      inventoryValue: inventoryAggr,
      totalCategories,
      totalSuppliers,
      totalSales: totalSalesCount,
      monthlyRevenue: Number(revenueAggr._sum.totalAmount || 0),
      lowStockProducts: lowStockCount,
      outOfStockProducts: outOfStockCount
    };
  }

  async getMonthlySales() {
    // Generate last 6 months data
    const sales = await prisma.sale.groupBy({
      by: ['createdAt'], // Grouping by exact timestamp, we'll format in JS for simplicity
      _sum: { totalAmount: true },
    });

    // Simple grouping by month-year
    const monthlyMap = new Map<string, number>();
    sales.forEach(sale => {
      const monthStr = sale.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyMap.set(monthStr, (monthlyMap.get(monthStr) || 0) + Number(sale._sum.totalAmount || 0));
    });

    return Array.from(monthlyMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }

  async getRecentActivities() {
    const activities = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } }
    });

    return activities.map(a => ({
      id: a.id,
      user: a.user.name,
      action: a.action,
      entity: a.entity,
      time: a.createdAt
    }));
  }

  async getTopSellingProducts() {
    const items = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true }
    });

    return items.map(i => ({
      product: products.find(p => p.id === i.productId),
      quantity: i._sum.quantity,
      revenue: i._sum.totalPrice
    }));
  }
}

export const dashboardService = new DashboardService();
