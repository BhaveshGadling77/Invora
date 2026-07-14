import prisma from '../config/database';
import { NotFoundError, AppError } from '../middleware/errorHandler';
import { PaginationQuery, buildPaginationMeta, parsePagination } from '../utils/response';
import { generatePurchaseNumber } from '../utils/helpers';
import { Prisma } from '@prisma/client';

export class PurchaseService {
  async getAll(query: PaginationQuery & { status?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const { search, sortBy = 'createdAt', sortOrder = 'desc', status } = query;

    const where: Prisma.PurchaseWhereInput = {
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { purchaseNumber: { contains: search } },
          { supplier: { companyName: { contains: search } } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.purchase.count({ where }),
      prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          supplier: { select: { id: true, companyName: true, contactPerson: true } },
          user: { select: { id: true, name: true } },
          _count: { select: { items: true } }
        },
      }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string) {
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } }
          }
        }
      },
    });
    if (!purchase) throw new NotFoundError('Purchase');
    return purchase;
  }

  async create(data: {
    supplierId: string;
    userId: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
    notes?: string;
  }) {
    const { supplierId, userId, items, notes } = data;

    // Calculate totals
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    // Assuming no tax/discount in basic creation for simplicity, or we can pass it
    const netAmount = totalAmount; 

    // Use transaction to ensure data integrity
    return prisma.$transaction(async (tx) => {
      // 1. Create Purchase
      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber: generatePurchaseNumber(),
          supplierId,
          userId,
          status: 'RECEIVED', // Assuming received immediately for this flow
          totalAmount,
          netAmount,
          notes,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              receivedQty: item.quantity
            }))
          }
        }
      });

      // 2. Update stock and create inventory history for each item
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new AppError(`Product ${item.productId} not found`);

        const newStock = product.currentStock + item.quantity;
        const stockStatus = newStock === 0 ? 'OUT_OF_STOCK' : (newStock <= product.minimumStock ? 'LOW_STOCK' : 'IN_STOCK');

        await tx.product.update({
          where: { id: item.productId },
          data: { 
            currentStock: newStock,
            stockStatus,
            // Update purchase price based on latest purchase
            purchasePrice: item.unitPrice
          }
        });

        await tx.inventoryHistory.create({
          data: {
            productId: item.productId,
            action: 'PURCHASE',
            refId: purchase.id,
            quantity: item.quantity,
            balance: newStock
          }
        });
      }

      return purchase;
    });
  }
}

export const purchaseService = new PurchaseService();
