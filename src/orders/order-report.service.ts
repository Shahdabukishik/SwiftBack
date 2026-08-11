import { Injectable } from '@nestjs/common';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import { OrdersService } from './orders.service';
import {
  renderBidiLineCenter,
  renderBidiLineRight,
  toDisplayString,
} from './bidi-text.util';

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

    doc.registerFont('Cairo', CAIRO_FONT_PATH);
    doc.font('Cairo').fillColor(TEXT);

    const marginX = 50;
    const pageRight = doc.page.width - marginX;
    const contentWidth = doc.page.width - marginX * 2;

    // Header (mirrored for RTL): logo + store name/address on the right,
    // order number + status on the left.
    const headerTop = doc.y;
    const infoZoneWidth = 140;
    const logoWidth = 44;

    doc.image(LOGO_PATH, pageRight - logoWidth, headerTop, {
      width: logoWidth,
    });

    doc.fillColor(ORANGE).fontSize(18);
    renderBidiLineRight(
      doc,
      order.store.name,
      pageRight - logoWidth - 10,
      headerTop,
    );
    doc.fillColor(GRAY).fontSize(9);
    renderBidiLineRight(
      doc,
      order.store.address,
      pageRight - logoWidth - 10,
      doc.y,
    );

    doc.fillColor(GRAY).fontSize(9);
    renderBidiLineRight(
      doc,
      `رقم الطلب: ${order.id}`,
      marginX + infoZoneWidth,
      headerTop,
    );
    doc.fillColor(ORANGE).fontSize(10);
    renderBidiLineRight(
      doc,
      ORDER_STATUS_LABELS[order.status] ?? order.status,
      marginX + infoZoneWidth,
      doc.y,
    );

    doc.y = Math.max(doc.y, headerTop + logoWidth) + 12;
    doc
      .moveTo(marginX, doc.y)
      .lineTo(marginX + contentWidth, doc.y)
      .strokeColor(ORANGE)
      .lineWidth(1.5)
      .stroke();
    doc.moveDown(1.5);

    // Customer on the right (reads first), order details on the left.
    const columnWidth = contentWidth / 2 - 10;
    const sectionTop = doc.y;
    const leftColRight = marginX + columnWidth;
    const rightColRight = marginX + contentWidth;

    const labelValue = (xRight: number, label: string, value: string) => {
      renderBidiLineRight(doc, `${label}: ${value}`, xRight, doc.y);
      doc.moveDown(0.3);
    };

    doc.y = sectionTop;
    doc.fillColor(ORANGE).fontSize(10);
    renderBidiLineRight(doc, 'تفاصيل الطلب', leftColRight, doc.y);
    doc.moveDown(0.3);
    doc.fillColor(TEXT).fontSize(9);
    labelValue(
      leftColRight,
      'النوع',
      ORDER_TYPE_LABELS[order.type] ?? order.type,
    );
    labelValue(leftColRight, 'وقت الطلب', order.createdAt.toLocaleString());
    if (order.estimatedReadyTimeMinutes != null) {
      labelValue(
        leftColRight,
        'وقت التجهيز',
        `${order.estimatedReadyTimeMinutes} دقيقة`,
      );
    }
    const leftBottom = doc.y;

    doc.y = sectionTop;
    doc.fillColor(ORANGE).fontSize(10);
    renderBidiLineRight(doc, 'بيانات العميل', rightColRight, doc.y);
    doc.moveDown(0.3);
    doc.fillColor(TEXT).fontSize(9);
    labelValue(
      rightColRight,
      'الاسم',
      `${order.user.firstName} ${order.user.lastName}`,
    );
    labelValue(rightColRight, 'الهاتف', order.phone);
    if (order.type === 'DELIVERY' && order.address) {
      labelValue(rightColRight, 'العنوان', order.address);
    }
    if (order.note) {
      labelValue(rightColRight, 'ملاحظة', order.note);
    }
    const rightBottom = doc.y;

    doc.x = marginX;
    doc.y = Math.max(leftBottom, rightBottom) + 15;

    // Items table, columns ordered right-to-left: item name is the
    // rightmost (main) column, numeric columns proceed to its left.
    doc.table({
      columnStyles: [70, 70, 50, '*'],
      defaultStyle: {
        padding: 6,
        border: [0, 0, 1, 0],
        borderColor: BORDER,
        textColor: TEXT,
        align: { x: 'right' },
      },
      data: [
        [
          { text: 'الإجمالي', backgroundColor: PEACH, textColor: ORANGE },
          {
            text: 'سعر الوحدة',
            backgroundColor: PEACH,
            textColor: ORANGE,
          },
          { text: 'الكمية', backgroundColor: PEACH, textColor: ORANGE },
          { text: 'الصنف', backgroundColor: PEACH, textColor: ORANGE },
        ],
        ...order.items.map((item) => [
          Number(item.totalPrice).toFixed(2),
          Number(item.unitPrice).toFixed(2),
          String(item.quantity),
          item.note
            ? `${toDisplayString(item.itemName)}\n${toDisplayString(item.note)}`
            : toDisplayString(item.itemName),
        ]),
      ],
    });

    doc.moveDown(1);

    // Totals, left-flush (the "end" of an RTL line), grand total highlighted.
    const subtotal = order.items.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0,
    );
    doc.fillColor(GRAY).fontSize(9);
    renderBidiLineRight(
      doc,
      `المجموع الفرعي: ${subtotal.toFixed(2)}`,
      marginX + 180,
      doc.y,
    );
    if (Number(order.deliveryFee) > 0) {
      doc.moveDown(0.2);
      renderBidiLineRight(
        doc,
        `رسوم التوصيل: ${Number(order.deliveryFee).toFixed(2)}`,
        marginX + 180,
        doc.y,
      );
    }

    doc.moveDown(0.5);
    const totalBoxWidth = 180;
    const totalBoxHeight = 28;
    const totalBoxX = marginX;
    const totalBoxY = doc.y;
    doc
      .roundedRect(totalBoxX, totalBoxY, totalBoxWidth, totalBoxHeight, 6)
      .fill(PEACH);
    doc.fillColor(ORANGE).fontSize(13);
    renderBidiLineRight(
      doc,
      `الإجمالي: ${Number(order.total).toFixed(2)}`,
      totalBoxX + totalBoxWidth,
      totalBoxY + 7,
    );

    doc.y = totalBoxY + totalBoxHeight + 30;
    doc
      .moveTo(marginX, doc.y)
      .lineTo(marginX + contentWidth, doc.y)
      .strokeColor(BORDER)
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.8);
    doc.fillColor(GRAY).fontSize(8);
    renderBidiLineCenter(
      doc,
      `تمت الطباعة في ${new Date().toLocaleString()}`,
      marginX + contentWidth / 2,
      doc.y,
    );

    doc.end();

    return done;
  }
}
