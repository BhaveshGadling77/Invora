import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
import { PaginationQuery, buildPaginationMeta, parsePagination } from '../utils/response';
import { Prisma } from '@prisma/client';

export class SupplierService {
  async getAll(query: PaginationQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: Prisma.SupplierWhereInput = search
      ? {
          OR: [
            { companyName: { contains: search } },
            { contactPerson: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [total, data] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, purchases: true } },
      },
    });
    if (!supplier) throw new NotFoundError('Supplier');
    return supplier;
  }

  async create(data: Prisma.SupplierCreateInput) {
    const existing = await prisma.supplier.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictError('Supplier email already exists');

    return prisma.supplier.create({ data });
  }

  async update(id: string, data: Prisma.SupplierUpdateInput) {
    await this.getById(id);

    if (data.email) {
      const existing = await prisma.supplier.findFirst({
        where: { email: data.email as string, id: { not: id } },
      });
      if (existing) throw new ConflictError('Supplier email already exists');
    }

    return prisma.supplier.update({ where: { id }, data });
  }

  async delete(id: string) {
    const supplier = await this.getById(id);

    if (supplier._count.products > 0 || supplier._count.purchases > 0) {
      throw new ConflictError('Cannot delete supplier with associated products or purchases');
    }

    return prisma.supplier.delete({ where: { id } });
  }
}

export const supplierService = new SupplierService();
