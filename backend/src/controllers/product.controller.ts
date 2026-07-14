import { Request, Response } from 'express';
import { productService } from '../services/product.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PaginationQuery } from '../types';

export const getAllProducts = async (req: Request, res: Response) => {
  const result = await productService.getAll(req.query as any);
  sendSuccess(res, result.data, 'Products retrieved', 200, result.meta);
};

export const getProductById = async (req: Request, res: Response) => {
  const product = await productService.getById(req.params.id as string);
  sendSuccess(res, product);
};

export const createProduct = async (req: Request, res: Response) => {
  const product = await productService.create(req.body, req.file);
  req.audit?.('CREATE', 'Product', product.id, undefined, product);
  sendCreated(res, product, 'Product created successfully');
};

export const updateProduct = async (req: Request, res: Response) => {
  const oldProduct = await productService.getById(req.params.id as string);
  const product = await productService.update(req.params.id as string, req.body, req.file);
  req.audit?.('UPDATE', 'Product', product.id, oldProduct, product);
  sendSuccess(res, product, 'Product updated successfully');
};

export const deleteProduct = async (req: Request, res: Response) => {
  const oldProduct = await productService.getById(req.params.id as string);
  await productService.delete(req.params.id as string);
  req.audit?.('DELETE', 'Product', req.params.id as string, oldProduct);
  sendSuccess(res, null, 'Product deleted (or discontinued)');
};
