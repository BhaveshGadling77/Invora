import { Request, Response } from 'express';
import { categoryService } from '../services/category.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PaginationQuery } from '../types';

export const getAllCategories = async (req: Request, res: Response) => {
  const result = await categoryService.getAll(req.query as PaginationQuery);
  sendSuccess(res, result.data, 'Categories retrieved', 200, result.meta);
};

export const getCategoryById = async (req: Request, res: Response) => {
  const category = await categoryService.getById(req.params.id as string);
  sendSuccess(res, category);
};

export const createCategory = async (req: Request, res: Response) => {
  const category = await categoryService.create(req.body);
  req.audit?.('CREATE', 'Category', category.id, undefined, category);
  sendCreated(res, category, 'Category created successfully');
};

export const updateCategory = async (req: Request, res: Response) => {
  const oldCategory = await categoryService.getById(req.params.id as string);
  const category = await categoryService.update(req.params.id as string, req.body);
  req.audit?.('UPDATE', 'Category', category.id, oldCategory, category);
  sendSuccess(res, category, 'Category updated successfully');
};

export const deleteCategory = async (req: Request, res: Response) => {
  const oldCategory = await categoryService.getById(req.params.id as string);
  await categoryService.delete(req.params.id as string);
  req.audit?.('DELETE', 'Category', req.params.id as string, oldCategory);
  sendSuccess(res, null, 'Category deleted successfully');
};
