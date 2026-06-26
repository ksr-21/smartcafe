const PDFDocument = require('pdfkit');

const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const cafe = invoice.cafeSnapshot || {};
      const primaryColor = '#FF6B35';
      const darkColor = '#1a1a2e';
      const lightGray = '#f8f9fa';

      // ── Header ──────────────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 120).fill(darkColor);

      // Cafe name
      doc.fillColor('#FFFFFF').fontSize(26).font('Helvetica-Bold')
        .text(cafe.businessName || 'SmartCafe', 50, 30);

      doc.fontSize(10).font('Helvetica').fillColor('#cccccc')
        .text(cafe.address ? `${cafe.address.street || ''}, ${cafe.address.city || ''} ${cafe.address.pincode || ''}` : '', 50, 60)
        .text(`Tel: ${cafe.mobile || ''} | Email: ${cafe.email || ''}`, 50, 75);

      if (cafe.gstNumber) {
        doc.text(`GSTIN: ${cafe.gstNumber}`, 50, 90);
      }

      // Invoice label
      doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold')
        .text('INVOICE', doc.page.width - 200, 30, { width: 150, align: 'right' });

      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica')
        .text(`#${invoice.invoiceNumber}`, doc.page.width - 200, 58, { width: 150, align: 'right' })
        .text(new Date(invoice.createdAt || Date.now()).toLocaleString('en-IN'), doc.page.width - 200, 73, { width: 150, align: 'right' });

      // ── Info Box ────────────────────────────────────────────────────
      const infoY = 140;
      doc.rect(50, infoY, doc.page.width - 100, 60).fill(lightGray);

      doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold')
        .text('TABLE', 70, infoY + 10)
        .text('CUSTOMER', 200, infoY + 10)
        .text('PAYMENT', 350, infoY + 10)
        .text('STATUS', 470, infoY + 10);

      doc.font('Helvetica').fillColor('#555555')
        .text(`Table ${invoice.tableNumber || 'N/A'}`, 70, infoY + 28)
        .text(invoice.customerName || 'Guest', 200, infoY + 28)
        .text(invoice.paymentMethod || 'Cash', 350, infoY + 28)
        .text(invoice.paymentStatus === 'paid' ? '✓ PAID' : 'UNPAID', 470, infoY + 28);

      // ── Items Table ─────────────────────────────────────────────────
      let y = infoY + 80;

      // Column headers
      doc.rect(50, y, doc.page.width - 100, 25).fill(darkColor);
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold')
        .text('ITEM', 65, y + 7)
        .text('QTY', 330, y + 7, { width: 50, align: 'center' })
        .text('PRICE', 400, y + 7, { width: 60, align: 'right' })
        .text('TOTAL', doc.page.width - 115, y + 7, { width: 60, align: 'right' });

      y += 30;

      // Items
      const items = invoice.items || [];
      items.forEach((item, idx) => {
        if (y > doc.page.height - 200) {
          doc.addPage();
          y = 50;
        }

        const rowBg = idx % 2 === 0 ? '#FFFFFF' : lightGray;
        doc.rect(50, y - 5, doc.page.width - 100, 22).fill(rowBg);

        doc.fillColor(darkColor).fontSize(10).font('Helvetica')
          .text(item.name, 65, y, { width: 260 })
          .text(String(item.quantity), 330, y, { width: 50, align: 'center' })
          .text(`₹${item.price.toFixed(2)}`, 400, y, { width: 60, align: 'right' })
          .text(`₹${item.subtotal.toFixed(2)}`, doc.page.width - 115, y, { width: 60, align: 'right' });

        y += 22;
      });

      // ── Totals ──────────────────────────────────────────────────────
      y += 15;
      const totalsX = doc.page.width - 250;
      const totalsWidth = 200;

      doc.moveTo(totalsX, y).lineTo(doc.page.width - 50, y).strokeColor('#dddddd').stroke();
      y += 10;

      const addTotalRow = (label, value, bold = false, color = darkColor) => {
        doc.fillColor(color).fontSize(10)
          .font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .text(label, totalsX, y, { width: totalsWidth / 2 })
          .text(value, totalsX + totalsWidth / 2, y, { width: totalsWidth / 2, align: 'right' });
        y += 18;
      };

      addTotalRow('Subtotal:', `₹${(invoice.subtotal || 0).toFixed(2)}`);
      if (invoice.discount > 0) {
        addTotalRow('Discount:', `-₹${(invoice.discount || 0).toFixed(2)}`, false, '#22c55e');
      }
      addTotalRow(`GST (${invoice.gstRate || 5}%):`, `₹${(invoice.gstAmount || 0).toFixed(2)}`);

      // Grand total box
      y += 5;
      doc.rect(totalsX - 10, y - 5, totalsWidth + 20, 30).fill(primaryColor);
      doc.fillColor('#FFFFFF').fontSize(13).font('Helvetica-Bold')
        .text('GRAND TOTAL:', totalsX, y + 3, { width: totalsWidth / 2 })
        .text(`₹${(invoice.totalAmount || 0).toFixed(2)}`, totalsX + totalsWidth / 2, y + 3, { width: totalsWidth / 2, align: 'right' });
      y += 45;

      // ── Footer ──────────────────────────────────────────────────────
      doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#dddddd').stroke();
      y += 15;

      doc.fillColor('#888888').fontSize(9).font('Helvetica')
        .text('Thank you for dining with us! We hope to see you again soon.', 50, y, {
          align: 'center',
          width: doc.page.width - 100,
        });
      y += 20;
      doc.text('Generated by SmartCafe • www.smartcafe.app', 50, y, {
        align: 'center',
        width: doc.page.width - 100,
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };
