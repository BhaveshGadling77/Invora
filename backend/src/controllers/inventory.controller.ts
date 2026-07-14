import { Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthRequest } from '../types';

export const getInventoryHistory = async (req: Request, res: Response) => {
  const result = await inventoryService.getHistory(req.query as any);
  sendSuccess(res, result.data, 'Inventory history retrieved', 200, result.meta);
};

export const adjustStock = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const adjustment = await inventoryService.adjustStock({ ...req.body, userId });
  req.audit?.('ADJUSTMENT', 'Inventory', adjustment.id, undefined, adjustment);
  sendCreated(res, adjustment, 'Stock adjusted successfully');
};

export const getLowStock = async (req: Request, res: Response) => {
  const products = await inventoryService.getLowStock();
  sendSuccess(res, products, 'Low stock products retrieved');
};

export const getOutOfStock = async (req: Request, res: Response) => {
  const products = await inventoryService.getOutOfStock();
  sendSuccess(res, products, 'Out of stock products retrieved');
};
