import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
import { PaginationQuery, buildPaginationMeta, parsePagination } from '../utils/response';
import { Prisma } from '@prisma/client';

export class CustomerService {
  async getAll(query: PaginationQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: Prisma.CustomerWhereInput = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [total, data] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: { select: { sales: true } },
      },
    });
    if (!customer) throw new NotFoundError('Customer');
    return customer;
  }

  async create(data: Prisma.CustomerCreateInput) {
    if (data.email) {
      const existing = await prisma.customer.findUnique({
        where: { email: data.email },
      });
      if (existing) throw new ConflictError('Customer email already exists');
    }

    return prisma.customer.create({ data });
  }

  async update(id: string, data: Prisma.CustomerUpdateInput) {
    await this.getById(id);

    if (data.email) {
      const existing = await prisma.customer.findFirst({
        where: { email: data.email as string, id: { not: id } },
      });
      if (existing) throw new ConflictError('Customer email already exists');
    }

    return prisma.customer.update({ where: { id }, data });
  }

  async delete(id: string) {
    const customer = await this.getById(id);

    if (customer._count.sales > 0) {
      throw new ConflictError('Cannot delete customer with associated sales');
    }

    return prisma.customer.delete({ where: { id } });
  }
}

export const customerService = new CustomerService();
