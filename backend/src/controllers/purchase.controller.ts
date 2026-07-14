import { Request, Response } from 'express';
import { purchaseService } from '../services/purchase.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthRequest } from '../types';

export const getAllPurchases = async (req: Request, res: Response) => {
  const result = await purchaseService.getAll(req.query as any);
  sendSuccess(res, result.data, 'Purchases retrieved', 200, result.meta);
};

export const getPurchaseById = async (req: Request, res: Response) => {
  const purchase = await purchaseService.getById(req.params.id as string);
  sendSuccess(res, purchase);
};

export const createPurchase = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const purchase = await purchaseService.create({ ...req.body, userId });
  req.audit?.('CREATE', 'Purchase', purchase.id, undefined, purchase);
  sendCreated(res, purchase, 'Purchase recorded successfully');
};
