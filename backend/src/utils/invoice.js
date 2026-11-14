import PDFDocument from 'pdfkit';

const money = (n) => `BDT ${Number(n || 0).toLocaleString('en-US')}`;

export const streamInvoice = (order, cfg, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
  doc.pipe(res);

  doc.rect(0, 0, 595, 90).fill('#3b2314');
  doc.fillColor('#e0b85a').fontSize(22).font('Helvetica-Bold').text(cfg.siteName || 'ECR Choco BD', 40, 30);
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica').text(`${cfg.address || ''}  |  ${cfg.hotline || ''}  |  ${cfg.email || ''}`, 40, 58);
  doc.fillColor('#000000');

  doc.fontSize(16).font('Helvetica-Bold').text('INVOICE', 40, 110);
  doc.fontSize(10).font('Helvetica')
    .text(`Order No: ${order.orderNumber}`, 40, 134)
    .text(`Date: ${new Date(order.createdAt).toLocaleString('en-GB')}`, 40, 148)
    .text(`Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})`, 40, 162);
  doc.font('Helvetica-Bold').text('Bill To', 350, 110).font('Helvetica')
    .text(order.customer.name, 350, 126).text(order.customer.phone, 350, 140)
    .text(order.customer.address, 350, 154, { width: 200 });

  let y = 215;
  doc.rect(40, y, 515, 22).fill('#f3ece4').fillColor('#3b2314').font('Helvetica-Bold').fontSize(10);
  doc.text('Item', 48, y + 6).text('Price', 340, y + 6, { width: 60, align: 'right' }).text('Qty', 410, y + 6, { width: 40, align: 'right' }).text('Total', 470, y + 6, { width: 78, align: 'right' });
  y += 28;
  doc.font('Helvetica').fillColor('#000000');
  for (const it of order.items) {
    const title = it.giftBox?.sizeName ? `Custom Gift Box - ${it.giftBox.sizeName}` : `${it.name} (${it.variantLabel})`;
    doc.fontSize(10).text(title, 48, y, { width: 280 });
    doc.text(money(it.price), 340, y, { width: 60, align: 'right' }).text(String(it.qty), 410, y, { width: 40, align: 'right' }).text(money(it.price * it.qty), 470, y, { width: 78, align: 'right' });
    y += 16;
    if (it.giftBox?.contents?.length) {
      doc.fontSize(8).fillColor('#666666');
      for (const c of it.giftBox.contents) { doc.text(`- ${c.name} (${c.variantLabel}) x ${c.qty}`, 58, y, { width: 270 }); y += 11; }
      doc.fillColor('#000000');
    }
    y += 6;
    if (y > 740) { doc.addPage(); y = 40; }
  }
  doc.moveTo(40, y).lineTo(555, y).strokeColor('#dddddd').stroke();
  y += 10;
  const row = (label, val, bold) => { doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10).text(label, 340, y, { width: 120, align: 'right' }).text(val, 470, y, { width: 78, align: 'right' }); y += bold ? 20 : 15; };
  row('Subtotal', money(order.subtotal));
  if (order.discount) row(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, `- ${money(order.discount)}`);
  row('Delivery', money(order.shippingFee));
  row('Total', money(order.total), true);
  doc.font('Helvetica').fontSize(9).fillColor('#666666').text('Thank you for shopping with us.', 40, 780, { align: 'center', width: 515 });
  doc.end();
};
