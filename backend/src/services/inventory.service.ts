import prisma from '../config/database';
import { NotFoundError, AppError } from '../middleware/errorHandler';
import { PaginationQuery, buildPaginationMeta, parsePagination } from '../utils/response';
import { AdjustmentType } from '@prisma/client';

export class InventoryService {
  async getHistory(query: PaginationQuery & { productId?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const { productId } = query;

    const where = productId ? { productId } : {};

    const [total, data] = await Promise.all([
      prisma.inventoryHistory.count({ where }),
      prisma.inventoryHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } }
        }
      }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async adjustStock(data: {
    productId: string;
    userId: string;
    type: AdjustmentType;
    quantity: number;
    reason: string;
  }) {
    const { productId, userId, type, quantity, reason } = data;

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new NotFoundError('Product');

      let newStock = product.currentStock;
      let diff = 0;

      if (type === 'ADD' || type === 'RETURN') {
        newStock += quantity;
        diff = quantity;
      } else if (type === 'REMOVE' || type === 'DAMAGE') {
        if (product.currentStock < quantity) {
          throw new AppError(`Cannot remove ${quantity}, current stock is ${product.currentStock}`);
        }
        newStock -= quantity;
        diff = -quantity;
      } else if (type === 'CORRECTION') {
        // Here quantity is the actual new stock
        diff = quantity - product.currentStock;
        newStock = quantity;
      }

      const stockStatus = newStock === 0 ? 'OUT_OF_STOCK' : (newStock <= product.minimumStock ? 'LOW_STOCK' : 'IN_STOCK');

      // Update product
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock, stockStatus }
      });

      // Create adjustment record
      const adjustment = await tx.stockAdjustment.create({
        data: {
          productId,
          userId,
          type,
          quantity: Math.abs(diff),
          reason,
          previousStock: product.currentStock,
          newStock
        }
      });

      // Create history
      if (diff !== 0) {
        await tx.inventoryHistory.create({
          data: {
            productId,
            action: 'ADJUSTMENT',
            refId: adjustment.id,
            quantity: diff,
            balance: newStock
          }
        });
      }

      return adjustment;
    });
  }

  async getLowStock() {
    return prisma.product.findMany({
      where: { stockStatus: 'LOW_STOCK' },
      include: { supplier: { select: { companyName: true } } }
    });
  }

  async getOutOfStock() {
    return prisma.product.findMany({
      where: { stockStatus: 'OUT_OF_STOCK' },
      include: { supplier: { select: { companyName: true } } }
    });
  }
}

export const inventoryService = new InventoryService();
