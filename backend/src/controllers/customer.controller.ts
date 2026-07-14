import { Request, Response } from 'express';
import { customerService } from '../services/customer.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PaginationQuery } from '../types';

export const getAllCustomers = async (req: Request, res: Response) => {
  const result = await customerService.getAll(req.query as PaginationQuery);
  sendSuccess(res, result.data, 'Customers retrieved', 200, result.meta);
};

export const getCustomerById = async (req: Request, res: Response) => {
  const customer = await customerService.getById(req.params.id);
  sendSuccess(res, customer);
};

export const createCustomer = async (req: Request, res: Response) => {
  const customer = await customerService.create(req.body);
  req.audit?.('CREATE', 'Customer', customer.id, undefined, customer);
  sendCreated(res, customer, 'Customer created successfully');
};

export const updateCustomer = async (req: Request, res: Response) => {
  const oldCustomer = await customerService.getById(req.params.id);
  const customer = await customerService.update(req.params.id, req.body);
  req.audit?.('UPDATE', 'Customer', customer.id, oldCustomer, customer);
  sendSuccess(res, customer, 'Customer updated successfully');
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const oldCustomer = await customerService.getById(req.params.id);
  await customerService.delete(req.params.id);
  req.audit?.('DELETE', 'Customer', req.params.id, oldCustomer);
  sendSuccess(res, null, 'Customer deleted successfully');
};
