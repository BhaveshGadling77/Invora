import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
import { PaginationQuery, buildPaginationMeta, parsePagination } from '../utils/response';
import { Prisma } from '@prisma/client';

export class CategoryService {
  async getAll(query: PaginationQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: Prisma.CategoryWhereInput = search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {};

    const [total, data] = await Promise.all([
      prisma.category.count({ where }),
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { products: true } },
        },
      }),
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) throw new NotFoundError('Category');
    return category;
  }

  async create(data: Prisma.CategoryCreateInput) {
    const existing = await prisma.category.findUnique({
      where: { name: data.name },
    });
    if (existing) throw new ConflictError('Category name already exists');

    return prisma.category.create({ data });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    await this.getById(id); // Check existence

    if (data.name) {
      const existing = await prisma.category.findFirst({
        where: { name: data.name as string, id: { not: id } },
      });
      if (existing) throw new ConflictError('Category name already exists');
    }

    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const category = await this.getById(id);

    if (category._count.products > 0) {
      throw new ConflictError('Cannot delete category with associated products');
    }

    return prisma.category.delete({ where: { id } });
  }
}

export const categoryService = new CategoryService();
