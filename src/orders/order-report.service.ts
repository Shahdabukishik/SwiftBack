import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { OrdersService } from './orders.service';

type OrderForReport = Awaited<ReturnType<OrdersService['findOrder']>>;

@Injectable()
export class OrderReportService {
  generatePdf(order: OrderForReport): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    doc.fontSize(18).font('Helvetica-Bold').text(order.store.name);
    doc.fontSize(10).font('Helvetica').text(order.store.address);
    doc.moveDown(1.5);

    doc.fontSize(14).font('Helvetica-Bold').text('Order Report');
    doc.fontSize(10).font('Helvetica').text(`Order #${order.id}`);
    doc.moveDown(1);

    doc.fontSize(11).font('Helvetica-Bold').text('Order details');
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Status: ${order.status}`)
      .text(`Type: ${order.type}`)
      .text(`Placed at: ${order.createdAt.toLocaleString()}`);
    if (order.estimatedReadyTimeMinutes != null) {
      doc.text(`Estimated ready time: ${order.estimatedReadyTimeMinutes} min`);
    }
    doc.moveDown(1);

    doc.fontSize(11).font('Helvetica-Bold').text('Customer');
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`${order.user.firstName} ${order.user.lastName}`)
      .text(`Phone: ${order.phone}`);
    if (order.type === 'DELIVERY' && order.address) {
      doc.text(`Delivery address: ${order.address}`);
    }
    if (order.note) {
      doc.text(`Note: ${order.note}`);
    }
    doc.moveDown(1.5);

    doc.table({
      columnStyles: ['*', 50, 70, 70],
      defaultStyle: { padding: 6 },
      data: [
        [
          { text: 'Item', font: { family: 'Helvetica-Bold' } },
          {
            text: 'Qty',
            font: { family: 'Helvetica-Bold' },
            align: { x: 'right' },
          },
          {
            text: 'Unit price',
            font: { family: 'Helvetica-Bold' },
            align: { x: 'right' },
          },
          {
            text: 'Total',
            font: { family: 'Helvetica-Bold' },
            align: { x: 'right' },
          },
        ],
        ...order.items.map((item) => [
          item.note ? `${item.itemName} (${item.note})` : item.itemName,
          { text: String(item.quantity), align: { x: 'right' as const } },
          {
            text: Number(item.unitPrice).toFixed(2),
            align: { x: 'right' as const },
          },
          {
            text: Number(item.totalPrice).toFixed(2),
            align: { x: 'right' as const },
          },
        ]),
      ],
    });

    doc.moveDown(1);
    const subtotal = order.items.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0,
    );
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Subtotal: ${subtotal.toFixed(2)}`, { align: 'right' });
    if (Number(order.deliveryFee) > 0) {
      doc.text(`Delivery fee: ${Number(order.deliveryFee).toFixed(2)}`, {
        align: 'right',
      });
    }
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`Total: ${Number(order.total).toFixed(2)}`, { align: 'right' });

    doc.moveDown(2);
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(`Printed at ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();

    return done;
  }
}
