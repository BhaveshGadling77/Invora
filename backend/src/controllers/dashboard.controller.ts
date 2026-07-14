import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

export const getDashboardStats = async (req: Request, res: Response) => {
  const stats = await dashboardService.getStats();
  sendSuccess(res, stats);
};

export const getMonthlySales = async (req: Request, res: Response) => {
  const sales = await dashboardService.getMonthlySales();
  sendSuccess(res, sales);
};

export const getRecentActivities = async (req: Request, res: Response) => {
  const activities = await dashboardService.getRecentActivities();
  sendSuccess(res, activities);
};

export const getTopSelling = async (req: Request, res: Response) => {
  const products = await dashboardService.getTopSellingProducts();
  sendSuccess(res, products);
};
