import { Request, Response } from 'express';
import { supplierService } from '../services/supplier.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PaginationQuery } from '../types';

export const getAllSuppliers = async (req: Request, res: Response) => {
  const result = await supplierService.getAll(req.query as PaginationQuery);
  sendSuccess(res, result.data, 'Suppliers retrieved', 200, result.meta);
};

export const getSupplierById = async (req: Request, res: Response) => {
  const supplier = await supplierService.getById(req.params.id as string);
  sendSuccess(res, supplier);
};

export const createSupplier = async (req: Request, res: Response) => {
  const supplier = await supplierService.create(req.body);
  req.audit?.('CREATE', 'Supplier', supplier.id, undefined, supplier);
  sendCreated(res, supplier, 'Supplier created successfully');
};

export const updateSupplier = async (req: Request, res: Response) => {
  const oldSupplier = await supplierService.getById(req.params.id as string);
  const supplier = await supplierService.update(req.params.id as string, req.body);
  req.audit?.('UPDATE', 'Supplier', supplier.id, oldSupplier, supplier);
  sendSuccess(res, supplier, 'Supplier updated successfully');
};

export const deleteSupplier = async (req: Request, res: Response) => {
  const oldSupplier = await supplierService.getById(req.params.id as string);
  await supplierService.delete(req.params.id as string);
  req.audit?.('DELETE', 'Supplier', req.params.id as string, oldSupplier);
  sendSuccess(res, null, 'Supplier deleted successfully');
};
