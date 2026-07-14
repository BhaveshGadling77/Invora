import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export class ReportService {
  async getSalesData(startDate?: Date, endDate?: Date) {
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = { gte: startDate, lte: endDate };
    }

    return prisma.sale.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPurchasesData(startDate?: Date, endDate?: Date) {
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = { gte: startDate, lte: endDate };
    }

    return prisma.purchase.findMany({
      where: whereClause,
      include: {
        supplier: true,
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getInventoryData() {
    return prisma.product.findMany({
      include: {
        category: true,
        supplier: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async generateCSV(data: any[], fields: string[]): Promise<string> {
    const parser = new Parser({ fields });
    return parser.parse(data);
  }

  async generateExcel(data: any[], columns: any[], sheetName: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns;
    data.forEach(row => worksheet.addRow(row));

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  async generatePDF(title: string, headers: string[], rows: string[][]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();

      // Simple Table layout
      const startX = 30;
      let startY = doc.y;
      const colWidth = 500 / headers.length;

      // Headers
      doc.fontSize(10).font('Helvetica-Bold');
      headers.forEach((header, i) => {
        doc.text(header, startX + (i * colWidth), startY, { width: colWidth });
      });

      startY += 20;
      doc.moveTo(startX, startY).lineTo(530, startY).stroke();
      startY += 10;

      // Rows
      doc.font('Helvetica');
      rows.forEach((row) => {
        if (startY > 750) {
          doc.addPage();
          startY = 50;
        }
        row.forEach((cell, i) => {
          doc.text(cell?.toString() || '-', startX + (i * colWidth), startY, { width: colWidth });
        });
        startY += 20;
      });

      doc.end();
    });
  }
}

export const reportService = new ReportService();
