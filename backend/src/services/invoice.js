import PDFDocument from 'pdfkit';

const money = (n) => `BDT ${Number(n || 0).toLocaleString('en-US')}`;

// NOTE: PDFKit's built-in fonts do not include Bengali glyphs. Register a Bengali TTF
// (e.g. Noto Sans Bengali) with doc.registerFont(...) if you need Bengali text in invoices.
export function streamInvoice(order, settings, res) {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
  doc.pipe(res);

  const brown = '#3b2314';
  const gold = '#b8892d';
  doc.rect(0, 0, doc.page.width, 90).fill(brown);
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(settings.siteName, 48, 30);
  doc.fillColor(gold).fontSize(9).font('Helvetica').text(settings.tagline || '', 48, 58);
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('INVOICE', 0, 34, { align: 'right', width: doc.page.width - 48 });

  doc.fillColor('#222').font('Helvetica').fontSize(10);
  let y = 115;
  doc.font('Helvetica-Bold').text('Order No:', 48, y).font('Helvetica').text(order.orderNumber, 120, y);
  doc.font('Helvetica-Bold').text('Date:', 48, y + 16).font('Helvetica').text(new Date(order.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }), 120, y + 16);
  doc.font('Helvetica-Bold').text('Payment:', 48, y + 32).font('Helvetica').text(`${order.paymentMethod.toUpperCase()} (${order.paymentStatus})`, 120, y + 32);

  doc.font('Helvetica-Bold').text('Bill / Ship to', 320, y);
  doc.font('Helvetica').text(`${order.customer.name}\n${order.customer.phone}\n${order.shipping.address}\n${order.shipping.area === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}`, 320, y + 16, { width: 230 });

  y = 215;
  doc.rect(48, y, doc.page.width - 96, 22).fill('#f3ece6');
  doc.fillColor(brown).font('Helvetica-Bold').fontSize(9);
  doc.text('ITEM', 56, y + 7).text('QTY', 340, y + 7, { width: 40, align: 'right' }).text('PRICE', 390, y + 7, { width: 60, align: 'right' }).text('TOTAL', 460, y + 7, { width: 80, align: 'right' });
  y += 28;
  doc.fillColor('#222').font('Helvetica').fontSize(9.5);
  for (const it of order.items) {
    doc.text(`${it.name}${it.variantLabel ? ' - ' + it.variantLabel : ''}`, 56, y, { width: 270 });
    let h = doc.heightOfString(`${it.name} ${it.variantLabel || ''}`, { width: 270 });
    doc.text(String(it.qty), 340, y, { width: 40, align: 'right' }).text(money(it.unitPrice), 390, y, { width: 60, align: 'right' }).text(money(it.lineTotal), 460, y, { width: 80, align: 'right' });
    if (it.isGiftBox) {
      doc.fillColor('#666').fontSize(8.5);
      const c = it.contents.map((x) => `${x.qty} x ${x.name} (${x.variantLabel})`).join(', ');
      doc.text(c, 64, y + h, { width: 260 });
      h += doc.heightOfString(c, { width: 260 });
      doc.fillColor('#222').fontSize(9.5);
    }
    y += h + 8;
    if (y > 700) { doc.addPage(); y = 60; }
  }
  doc.moveTo(48, y).lineTo(doc.page.width - 48, y).strokeColor('#ddd').stroke();
  y += 10;
  const row = (label, val, bold) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 10).fillColor(bold ? brown : '#222');
    doc.text(label, 340, y, { width: 110, align: 'right' }).text(val, 460, y, { width: 80, align: 'right' });
    y += bold ? 20 : 16;
  };
  row('Subtotal', money(order.subtotal));
  if (order.discount) row(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, `- ${money(order.discount)}`);
  row('Delivery', money(order.shippingFee));
  row('Total', money(order.total), true);

  doc.fillColor('#777').font('Helvetica').fontSize(8.5).text(`Thank you for shopping with ${settings.siteName}.  Hotline: ${settings.hotline}  |  ${settings.email}`, 48, doc.page.height - 70, { align: 'center', width: doc.page.width - 96 });
  doc.end();
}
