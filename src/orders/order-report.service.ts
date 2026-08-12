import { Injectable } from '@nestjs/common';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import { OrdersService } from './orders.service';
import { GUEST_USER_ID } from './orders.constants';
import { renderBidiLineCenter, renderBidiLineRight } from './bidi-text.util';

type OrderForReport = Awaited<ReturnType<OrdersService['findOrder']>>;

// Sa7eta Shawerma brand palette (from sa7eta-admin-ui).
const ORANGE = '#fb4501';
const PEACH = '#fbf2ec';
const GRAY = '#8b8b8c';
const BORDER = '#d9d9d9';
const TEXT = '#111827';

const LOGO_PATH = join(__dirname, 'assets', 'logo.png');
const CAIRO_FONT_PATH = join(__dirname, 'assets', 'Cairo-Variable.ttf');

const ORDER_TYPE_LABELS: Record<string, string> = {
  PICKUP: 'استلام من المتجر',
  DELIVERY: 'توصيل',
  IN_STORE: 'داخل المتجر',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'تم التأكيد',
  IN_PROGRESS: 'قيد التحضير',
  FINISHED: 'مكتمل',
  CANCELLED: 'ملغي',
};

// Narrow receipt ticket sized for an 80mm thermal/POS printer, not a full
// A4 sheet. The needed height depends on item count and isn't known up
// front, so generatePdf() renders once on a tall scratch page purely to
// measure the content height, then renders again on a page created at
// exactly that height.
const RECEIPT_WIDTH = 227; // 80mm
const RECEIPT_MAX_HEIGHT = 3000;
const MARGIN = 14;

@Injectable()
export class OrderReportService {
  generatePdf(order: OrderForReport): Promise<Buffer> {
    const measureDoc = new PDFDocument({
      size: [RECEIPT_WIDTH, RECEIPT_MAX_HEIGHT],
      margin: MARGIN,
    });
    measureDoc.on('data', () => {});
    measureDoc.on('error', () => {});
    measureDoc.registerFont('Cairo', CAIRO_FONT_PATH);
    measureDoc.font('Cairo').fillColor(TEXT);
    this.renderContent(measureDoc, order);
    const contentHeight = Math.min(measureDoc.y + MARGIN, RECEIPT_MAX_HEIGHT);
    measureDoc.end();

    const doc = new PDFDocument({
      size: [RECEIPT_WIDTH, contentHeight],
      margin: MARGIN,
    });
    const chunks: Buffer[] = [];

    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    doc.registerFont('Cairo', CAIRO_FONT_PATH);
    doc.font('Cairo').fillColor(TEXT);
    this.renderContent(doc, order);
    doc.end();

    return done;
  }

  private renderContent(doc: PDFKit.PDFDocument, order: OrderForReport): void {
    const pageRight = doc.page.width - MARGIN;
    const contentWidth = doc.page.width - MARGIN * 2;
    const centerX = MARGIN + contentWidth / 2;

    const divider = (dashed = true) => {
      doc.moveDown(0.5);
      if (dashed) doc.dash(2, { space: 2 });
      doc
        .moveTo(MARGIN, doc.y)
        .lineTo(pageRight, doc.y)
        .strokeColor(BORDER)
        .lineWidth(1)
        .stroke();
      if (dashed) doc.undash();
      doc.moveDown(0.5);
    };

    const labelValue = (label: string, value: string) => {
      doc.fillColor(TEXT).fontSize(8);
      renderBidiLineRight(doc, `${label}: ${value}`, pageRight, doc.y);
      doc.moveDown(0.3);
    };

    // Header: centered logo, store name, address.
    const logoWidth = 40;
    doc.image(LOGO_PATH, centerX - logoWidth / 2, doc.y, {
      width: logoWidth,
    });
    doc.y += logoWidth + 8;

    doc.fillColor(ORANGE).fontSize(14);
    renderBidiLineCenter(doc, order.store.name, centerX, doc.y);
    doc.moveDown(0.2);
    doc.fillColor(GRAY).fontSize(8);
    renderBidiLineCenter(doc, order.store.address, centerX, doc.y);
    doc.moveDown(0.4);

    divider();

    // Order info.
    doc.fillColor(GRAY).fontSize(8);
    renderBidiLineRight(doc, `رقم الطلب: ${order.id}`, pageRight, doc.y);
    doc.moveDown(0.3);
    doc.fillColor(ORANGE).fontSize(9);
    renderBidiLineRight(
      doc,
      ORDER_STATUS_LABELS[order.status] ?? order.status,
      pageRight,
      doc.y,
    );
    doc.moveDown(0.3);
    labelValue('النوع', ORDER_TYPE_LABELS[order.type] ?? order.type);
    labelValue('وقت الطلب', order.createdAt.toLocaleString());
    if (order.estimatedReadyTimeMinutes != null) {
      labelValue('وقت التجهيز', `${order.estimatedReadyTimeMinutes} دقيقة`);
    }

    divider();

    // Customer info.
    const link = order.customerOrder;
    const customer =
      link && link.customerId !== GUEST_USER_ID ? link.customer : null;
    labelValue(
      'الاسم',
      customer ? `${customer.firstName} ${customer.lastName}` : 'ضيف',
    );
    labelValue('الهاتف', order.phone);
    if (order.type === 'DELIVERY' && order.address) {
      labelValue('العنوان', order.address);
    }
    if (order.note) {
      labelValue('ملاحظة', order.note);
    }

    divider();

    // Items: name right-aligned on its own line, qty x unit price / total
    // on the line below it.
    for (const item of order.items) {
      doc.fillColor(TEXT).fontSize(9);
      renderBidiLineRight(doc, item.itemName, pageRight, doc.y);
      doc.moveDown(0.15);
      if (item.note) {
        doc.fillColor(GRAY).fontSize(7);
        renderBidiLineRight(doc, item.note, pageRight, doc.y);
        doc.moveDown(0.15);
      }
      doc.fillColor(GRAY).fontSize(8);
      doc.text(Number(item.totalPrice).toFixed(2), MARGIN, doc.y, {
        continued: false,
      });
      renderBidiLineRight(
        doc,
        `${item.quantity} × ${Number(item.unitPrice).toFixed(2)}`,
        pageRight,
        doc.y - doc.currentLineHeight(),
      );
      doc.moveDown(0.4);
    }

    divider();

    // Totals.
    const subtotal = order.items.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0,
    );
    doc.fillColor(GRAY).fontSize(8);
    renderBidiLineRight(
      doc,
      `المجموع الفرعي: ${subtotal.toFixed(2)}`,
      pageRight,
      doc.y,
    );
    doc.moveDown(0.3);
    if (Number(order.deliveryFee) > 0) {
      renderBidiLineRight(
        doc,
        `رسوم التوصيل: ${Number(order.deliveryFee).toFixed(2)}`,
        pageRight,
        doc.y,
      );
      doc.moveDown(0.3);
    }

    doc.moveDown(0.2);
    const totalBoxHeight = 24;
    const totalBoxY = doc.y;
    doc
      .roundedRect(MARGIN, totalBoxY, contentWidth, totalBoxHeight, 5)
      .fill(PEACH);
    doc.fillColor(ORANGE).fontSize(11);
    renderBidiLineRight(
      doc,
      `الإجمالي: ${Number(order.total).toFixed(2)}`,
      pageRight - 8,
      totalBoxY + 6,
    );
    doc.y = totalBoxY + totalBoxHeight;

    divider(false);

    doc.fillColor(GRAY).fontSize(7);
    renderBidiLineCenter(
      doc,
      `تمت الطباعة في ${new Date().toLocaleString()}`,
      centerX,
      doc.y,
    );
    doc.moveDown(0.5);
  }
}
