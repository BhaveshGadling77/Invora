import prisma from '../config/database';
import { NotFoundError, AppError } from '../middleware/errorHandler';
import { PaginationQuery, buildPaginationMeta, parsePagination } from '../utils/response';
import { generateInvoiceNumber } from '../utils/helpers';
import { Prisma, PaymentMethod } from '@prisma/client';

export class SaleService {
  async getAll(query: PaginationQuery & { status?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const { search, sortBy = 'createdAt', sortOrder = 'desc', status } = query;

    const where: Prisma.SaleWhereInput = {
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search } },
          { customer: { name: { contains: search } } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          user: { select: { id: true, name: true } },
          _count: { select: { items: true } }
        },
      }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string) {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } }
          }
        }
      },
    });
    if (!sale) throw new NotFoundError('Sale');
    return sale;
  }

  async create(data: {
    customerId?: string;
    userId: string;
    items: { productId: string; quantity: number; unitPrice: number; discount?: number }[];
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
  }) {
    const { customerId, userId, items, paymentMethod, amountPaid, notes } = data;

    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;

    const itemsData = items.map(item => {
      const discount = item.discount || 0;
      const priceAfterDiscount = item.unitPrice * (1 - discount / 100);
      const totalPrice = item.quantity * priceAfterDiscount;
      
      subtotal += (item.quantity * item.unitPrice);
      totalDiscount += (item.quantity * item.unitPrice) - totalPrice;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount,
        totalPrice
      };
    });

    const totalAmount = subtotal - totalDiscount;
    const balanceDue = totalAmount - amountPaid;
    const paymentStatus = balanceDue <= 0 ? 'PAID' : (amountPaid > 0 ? 'PARTIAL' : 'UNPAID');

    // Transaction
    return prisma.$transaction(async (tx) => {
      // Check stock first
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new AppError(`Product ${item.productId} not found`);
        if (product.currentStock < item.quantity) {
          throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.currentStock}`);
        }
      }

      // 1. Create Sale
      const sale = await tx.sale.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          customerId,
          userId,
          status: 'COMPLETED',
          paymentMethod,
          paymentStatus,
          subtotal,
          discountAmount: totalDiscount,
          totalAmount,
          amountPaid,
          balanceDue,
          notes,
          items: { create: itemsData }
        }
      });

      // 2. Update stock, create history, optionally update customer stats
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product) {
          const newStock = product.currentStock - item.quantity;
          const stockStatus = newStock === 0 ? 'OUT_OF_STOCK' : (newStock <= product.minimumStock ? 'LOW_STOCK' : 'IN_STOCK');

          await tx.product.update({
            where: { id: item.productId },
            data: { 
              currentStock: newStock,
              stockStatus 
            }
          });

          await tx.inventoryHistory.create({
            data: {
              productId: item.productId,
              action: 'SALE',
              refId: sale.id,
              quantity: -item.quantity, // Negative for outgoing
              balance: newStock
            }
          });
        }
      }

      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: totalAmount }
          }
        });
      }

      return sale;
    });
  }
}

export const saleService = new SaleService();
