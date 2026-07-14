import prisma from '../config/database';
import cloudinary from '../config/cloudinary';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';
import { PaginationQuery, buildPaginationMeta, parsePagination } from '../utils/response';
import { generateSKU } from '../utils/helpers';
import { Prisma } from '@prisma/client';

export class ProductService {
  async getAll(query: PaginationQuery & { categoryId?: string; status?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const { search, sortBy = 'createdAt', sortOrder = 'desc', categoryId, status } = query;

    const where: Prisma.ProductWhereInput = {
      ...(categoryId && { categoryId }),
      ...(status && { status: status as any }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { barcode: { contains: search } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, companyName: true } },
        },
      }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
      },
    });
    if (!product) throw new NotFoundError('Product');
    return product;
  }

  async create(data: Prisma.ProductUncheckedCreateInput, file?: Express.Multer.File) {
    // Generate SKU if not provided
    if (!data.sku) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new NotFoundError('Category');
      data.sku = generateSKU(category.name);
    }

    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) throw new ConflictError('SKU already exists');

    if (data.barcode) {
      const existingBarcode = await prisma.product.findUnique({ where: { barcode: data.barcode } });
      if (existingBarcode) throw new ConflictError('Barcode already exists');
    }

    let imageUrl = null;
    let imagePublicId = null;

    if (file) {
      // Upload to Cloudinary
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'inventra/products',
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    return prisma.product.create({
      data: {
        ...data,
        imageUrl,
        imagePublicId,
        ...(data.currentStock !== undefined && data.minimumStock !== undefined && {
          stockStatus: Number(data.currentStock) === 0 ? 'OUT_OF_STOCK' : (Number(data.currentStock) <= Number(data.minimumStock) ? 'LOW_STOCK' : 'IN_STOCK')
        })
      },
    });
  }

  async update(id: string, data: Prisma.ProductUncheckedUpdateInput, file?: Express.Multer.File) {
    const product = await this.getById(id);

    if (data.sku && data.sku !== product.sku) {
      const existing = await prisma.product.findUnique({ where: { sku: data.sku as string } });
      if (existing) throw new ConflictError('SKU already exists');
    }

    let imageUrl = product.imageUrl;
    let imagePublicId = product.imagePublicId;

    if (file) {
      // Delete old image if exists
      if (product.imagePublicId) {
        await cloudinary.uploader.destroy(product.imagePublicId);
      }
      
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'inventra/products',
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    // Determine new stock status
    const newCurrentStock = data.currentStock !== undefined ? Number(data.currentStock) : product.currentStock;
    const newMinStock = data.minimumStock !== undefined ? Number(data.minimumStock) : product.minimumStock;
    
    let stockStatus: any = product.stockStatus;
    if (newCurrentStock === 0) stockStatus = 'OUT_OF_STOCK';
    else if (newCurrentStock <= newMinStock) stockStatus = 'LOW_STOCK';
    else stockStatus = 'IN_STOCK';

    return prisma.product.update({
      where: { id },
      data: {
        ...data,
        imageUrl,
        imagePublicId,
        stockStatus
      },
    });
  }

  async delete(id: string) {
    const product = await this.getById(id);

    // Don't actually delete if it has history, just mark as DISCONTINUED
    const hasHistory = await prisma.inventoryHistory.findFirst({ where: { productId: id } });
    
    if (hasHistory) {
      return prisma.product.update({
        where: { id },
        data: { status: 'DISCONTINUED' }
      });
    }

    if (product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }

    return prisma.product.delete({ where: { id } });
  }
}

export const productService = new ProductService();
