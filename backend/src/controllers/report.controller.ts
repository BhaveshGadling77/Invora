import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { sendError } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

export const exportSales = async (req: Request, res: Response) => {
  const format = req.query.format as string || 'csv';
  const data = await reportService.getSalesData();

  if (format === 'csv') {
    const fields = ['invoiceNumber', 'totalAmount', 'paymentMethod', 'status', 'createdAt'];
    const csvData = data.map(sale => ({
      invoiceNumber: sale.invoiceNumber,
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      createdAt: sale.createdAt.toISOString()
    }));
    const csv = await reportService.generateCSV(csvData, fields);
    res.header('Content-Type', 'text/csv');
    res.attachment('sales-report.csv');
    return res.send(csv);
  } else if (format === 'excel') {
    const columns = [
      { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
      { header: 'Amount', key: 'totalAmount', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Date', key: 'createdAt', width: 25 },
    ];
    const excelData = data.map(sale => ({
      ...sale,
      createdAt: sale.createdAt.toISOString()
    }));
    const buffer = await reportService.generateExcel(excelData, columns, 'Sales');
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment('sales-report.xlsx');
    return res.send(buffer);
  } else if (format === 'pdf') {
    const headers = ['Invoice No.', 'Amount', 'Payment', 'Status', 'Date'];
    const rows = data.map(sale => [
      sale.invoiceNumber,
      `$${sale.totalAmount.toFixed(2)}`,
      sale.paymentMethod,
      sale.status,
      new Date(sale.createdAt).toLocaleDateString()
    ]);
    const buffer = await reportService.generatePDF('Sales Report', headers, rows);
    res.header('Content-Type', 'application/pdf');
    res.attachment('sales-report.pdf');
    return res.send(buffer);
  }

  throw new AppError('Invalid format', 400);
};

export const exportInventory = async (req: Request, res: Response) => {
  const format = req.query.format as string || 'csv';
  const data = await reportService.getInventoryData();

  if (format === 'csv') {
    const fields = ['sku', 'name', 'currentStock', 'sellingPrice', 'status'];
    const csv = await reportService.generateCSV(data, fields);
    res.header('Content-Type', 'text/csv');
    res.attachment('inventory-report.csv');
    return res.send(csv);
  } else if (format === 'excel') {
    const columns = [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Stock', key: 'currentStock', width: 10 },
      { header: 'Price', key: 'sellingPrice', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    const buffer = await reportService.generateExcel(data, columns, 'Inventory');
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment('inventory-report.xlsx');
    return res.send(buffer);
  } else if (format === 'pdf') {
    const headers = ['SKU', 'Name', 'Stock', 'Price', 'Status'];
    const rows = data.map(p => [
      p.sku || '-',
      p.name,
      p.currentStock.toString(),
      `$${p.sellingPrice.toFixed(2)}`,
      p.status
    ]);
    const buffer = await reportService.generatePDF('Inventory Report', headers, rows);
    res.header('Content-Type', 'application/pdf');
    res.attachment('inventory-report.pdf');
    return res.send(buffer);
  }

  throw new AppError('Invalid format', 400);
};
