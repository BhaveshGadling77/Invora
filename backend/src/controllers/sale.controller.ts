import { Request, Response } from 'express';
import { saleService } from '../services/sale.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthRequest } from '../types';

export const getAllSales = async (req: Request, res: Response) => {
  const result = await saleService.getAll(req.query as any);
  sendSuccess(res, result.data, 'Sales retrieved', 200, result.meta);
};

export const getSaleById = async (req: Request, res: Response) => {
  const sale = await saleService.getById(req.params.id as string);
  sendSuccess(res, sale);
};

export const createSale = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const sale = await saleService.create({ ...req.body, userId });
  req.audit?.('CREATE', 'Sale', sale.id, undefined, sale);
  sendCreated(res, sale, 'Invoice created successfully');
};
