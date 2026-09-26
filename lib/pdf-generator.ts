import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { DocumentRecord, DocumentTemplate, OrganizationSettings } from './types';
import { formatINR, formatDateDisplay, getDeclarationText, generateBillingPeriodText } from './template-engine';

export interface GeneratePdfOptions {
  document: DocumentRecord;
  template: DocumentTemplate;
  organization: OrganizationSettings;
}

export async function generateDocumentPdf(options: GeneratePdfOptions): Promise<Uint8Array> {
  const { document: doc, template, organization: org } = options;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Load custom fonts with Rupee symbol support
  const fontDir = path.join(process.cwd(), 'public', 'fonts');
  const regularFontPath = path.join(fontDir, 'regular.ttf');
  const boldFontPath = path.join(fontDir, 'bold.ttf');

  let regularFont: PDFFont;
  let boldFont: PDFFont;

  if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
    const regBytes = fs.readFileSync(regularFontPath);
    const boldBytes = fs.readFileSync(boldFontPath);
    regularFont = await pdfDoc.embedFont(regBytes);
    boldFont = await pdfDoc.embedFont(boldBytes);
  } else {
    regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  }

  // Load master template background image
  const templatePath = path.join(process.cwd(), 'public', template.background_image.replace(/^\//, ''));
  let embeddedBgImage = null;
  if (fs.existsSync(templatePath)) {
    const imgBytes = fs.readFileSync(templatePath);
    embeddedBgImage = await pdfDoc.embedPng(imgBytes);
  }

  const a4Width = 595.28;
  const a4Height = 841.89;

  // Exact scale factors
  const scaleX = a4Width / template.canvasWidth;
  const scaleY = a4Height / template.canvasHeight;

  function toPdfX(x: number): number {
    return x * scaleX;
  }

  function toPdfSize(val: number): number {
    return val * scaleY;
  }

  // Converts canvas center Y to PDF text baseline Y
  function toPdfBaselineY(centerCanvasY: number, fontSizePt: number): number {
    // In canvas (0 top), baseline is approximately center + 0.35 * fontSize
    const canvasBaseline = centerCanvasY + fontSizePt * 0.35;
    return (template.canvasHeight - canvasBaseline) * scaleY;
  }

  const isInvoice = template.type === 'invoice';
  const isBill = template.type === 'bill';
  const maxRowsPage1 = isBill ? 4 : 3;
  const items = doc.items || [];
  const needsPage2 = items.length > maxRowsPage1;

  // Colors
  const navyColor = rgb(0.06, 0.09, 0.16); // #0F172A
  const blueColor = rgb(0.145, 0.388, 0.922); // #2563EB

  // ==========================================
  // PAGE 1 RENDERING
  // ==========================================
  const page1 = pdfDoc.addPage([a4Width, a4Height]);

  if (embeddedBgImage) {
    page1.drawImage(embeddedBgImage, {
      x: 0,
      y: 0,
      width: a4Width,
      height: a4Height,
    });
  }

  if (isInvoice) {
    // --- Header Right Metadata (Colons at x=475, values start at x=488) ---
    const invNo = doc.documentNumber || '';
    const invDate = formatDateDisplay(doc.documentDate);
    const clientName = doc.clientData?.name || '';
    const clientEmail = doc.clientData?.email || '';
    const purpose = doc.purpose || '';
    const currency = doc.currency || 'INR';

    drawTextAtCenterY(page1, invNo, 488, 117, boldFont, 10, navyColor);
    drawTextAtCenterY(page1, invDate, 488, 146, regularFont, 9.5, navyColor);
    drawTextAtCenterY(page1, clientName, 488, 176, boldFont, 9.5, navyColor);
    drawTextAtCenterY(page1, clientEmail, 488, 207, regularFont, 9, navyColor);
    drawTextAtCenterY(page1, purpose, 488, 239, regularFont, 9.5, navyColor);
    drawTextAtCenterY(page1, currency, 488, 269, boldFont, 9.5, navyColor);

    // --- Table Page 1 Rows ---
    // Row 1: 350 to 418 (center = 384)
    // Row 2: 418 to 473 (center = 445.5)
    // Row 3: 473 to 530 (center = 501.5)
    const invRowCenters = [384.0, 445.5, 501.5];
    const page1Items = needsPage2 ? items.slice(0, 3) : items;

    page1Items.forEach((item, index) => {
      const rowCenterY = invRowCenters[index] || (384 + index * 58);

      // Col 1: Sr No (Column 26 to 106, center = 66)
      drawTextCenteredAt(page1, String(item.srNo), 66, rowCenterY, regularFont, 10, navyColor);

      // Col 2: Project / Service (Start at x = 116, max width 168)
      if (item.name.length > 25) {
        drawTextWrappedLines(page1, item.name, 116, rowCenterY - 8, 168, boldFont, 9.5, navyColor, 12, 2);
      } else {
        drawTextAtCenterY(page1, item.name, 116, rowCenterY, boldFont, 9.5, navyColor);
      }

      // Col 3: Description (Start at x = 299, max width 210)
      if (item.description) {
        drawTextWrappedLines(page1, item.description, 299, rowCenterY - 8, 210, regularFont, 8.5, navyColor, 11, 3);
      }

      // Col 4: Amount (Right align at x = 642)
      const amtStr = formatINR(item.amount);
      drawTextRightAligned(page1, amtStr, 642, rowCenterY, boldFont, 10.5, navyColor);
    });

    // Total Row (530 to 578, center = 554)
    if (!needsPage2) {
      const totalStr = formatINR(doc.payment.totalAmount);
      drawTextRightAligned(page1, totalStr, 642, 554, boldFont, 11.5, navyColor);
    } else {
      drawTextRightAligned(page1, '(Continued on Page 2)', 642, 554, regularFont, 9, blueColor);
    }

    // --- Project Section Checkboxes ---
    // Exact squares: 1: (30,639), 2: (167,639), 3: (302,639), 4: (415,639), 5: (470,639), 6: (558,639)
    const invBoxes: Record<string, { x: number; y: number; size: number }> = {
      'Web Development': { x: 30, y: 639, size: 15 },
      'Mobile Development': { x: 167, y: 639, size: 15 },
      'Digital Marketing': { x: 302, y: 639, size: 15 },
      'SEO': { x: 415, y: 639, size: 15 },
      'AI Solution': { x: 470, y: 639, size: 15 },
      'ERP CRM SYSTEM': { x: 558, y: 639, size: 15 },
    };

    const selectedCategories = new Set(doc.projectCategories || []);
    Object.entries(invBoxes).forEach(([label, box]) => {
      if (selectedCategories.has(label)) {
        drawVectorCheckmark(page1, box.x, box.y, box.size);
      }
    });

    // --- Payment Summary (Colons at x=186, values start at x=198) ---
    drawTextAtCenterY(page1, formatINR(doc.payment.totalAmount), 198, 726, boldFont, 10, navyColor);
    drawTextAtCenterY(page1, formatINR(doc.payment.amountPaid), 198, 749, regularFont, 9.5, navyColor);
    drawTextAtCenterY(page1, formatINR(doc.payment.balanceAmount), 198, 773, boldFont, 10, navyColor);
    drawTextAtCenterY(page1, doc.payment.currency || 'INR', 198, 797, regularFont, 9.5, navyColor);
    drawTextAtCenterY(page1, doc.payment.status || 'PENDING', 198, 821, boldFont, 10, doc.payment.status === 'PAID' ? rgb(0.08, 0.5, 0.24) : blueColor);

    // --- Declaration Box (x=413, y=693, width=242, height=138) ---
    const declaration = doc.declarationText || getDeclarationText(doc.payment.status, org.declarationPresets);
    drawTextWrappedLines(page1, declaration, 428, 746, 214, regularFont, 8.5, navyColor, 12.5, 4);

    // --- Prepared By (Colons at x=142, values start at x=154) ---
    const prepName = doc.preparedBy?.name || org.teamMembers[0]?.name || '';
    const prepOrg = doc.preparedBy?.organization || org.name;
    drawTextAtCenterY(page1, prepName, 154, 884, boldFont, 9.5, navyColor);
    drawTextAtCenterY(page1, prepOrg, 154, 907, regularFont, 9, navyColor);

  } else if (isBill) {
    // --- Header Right Metadata (Colons at x=544, values start at x=556) ---
    const billNo = doc.documentNumber || '';
    const billDate = formatDateDisplay(doc.documentDate);
    const dueDate = formatDateDisplay(doc.dueDate);
    const billingPeriod = doc.billingPeriod?.displayText || generateBillingPeriodText(doc.billingPeriod?.startDate, doc.billingPeriod?.endDate);

    drawTextAtCenterY(page1, billNo, 556, 162, boldFont, 10, navyColor);
    drawTextAtCenterY(page1, billDate, 556, 196, regularFont, 9.5, navyColor);
    drawTextAtCenterY(page1, dueDate, 556, 233, regularFont, 9.5, navyColor);
    drawTextAtCenterY(page1, billingPeriod, 556, 266, regularFont, 9, navyColor);

    // --- Billed To Container (Colons at x=180, values start at x=194) ---
    const clientName = doc.clientData?.name || '';
    const compName = doc.clientData?.companyName || '';
    const clientEmail = doc.clientData?.email || '';
    const clientPhone = doc.clientData?.phone || '';

    drawTextAtCenterY(page1, clientName, 194, 378, boldFont, 10, navyColor);
    drawTextAtCenterY(page1, compName, 194, 408, regularFont, 9.5, navyColor);
    drawTextAtCenterY(page1, clientEmail, 194, 438, regularFont, 9.5, navyColor);
    drawTextAtCenterY(page1, clientPhone, 194, 467, regularFont, 9.5, navyColor);

    // --- Table Page 1 Rows ---
    // Row 1: 541 to 596 (center = 568.5)
    // Row 2: 596 to 651 (center = 623.5)
    // Row 3: 651 to 705 (center = 678.0)
    // Row 4: 705 to 759 (center = 732.0)
    const billRowCenters = [568.5, 623.5, 678.0, 732.0];
    const page1Items = needsPage2 ? items.slice(0, 4) : items;

    page1Items.forEach((item, index) => {
      const rowCenterY = billRowCenters[index] || (568.5 + index * 55);

      // Col 2: Service / Description (Start at x = 115, max width 250)
      if (item.name.length > 32) {
        drawTextWrappedLines(page1, item.name, 115, rowCenterY - 8, 250, boldFont, 9.5, navyColor, 12, 2);
      } else {
        drawTextAtCenterY(page1, item.name, 115, rowCenterY, boldFont, 9.5, navyColor);
      }

      // Col 3: Duration (Center at x = 466.5)
      drawTextCenteredAt(page1, item.duration || '-', 466.5, rowCenterY, regularFont, 9.5, navyColor);

      // Col 4: Amount (Right align at x = 675)
      const amtStr = formatINR(item.amount);
      drawTextRightAligned(page1, amtStr, 675, rowCenterY, boldFont, 10.5, navyColor);
    });

    // Total Row (759 to 800, center = 779.5)
    if (!needsPage2) {
      const totalStr = formatINR(doc.payment.totalAmount);
      drawTextRightAligned(page1, totalStr, 675, 779.5, boldFont, 11.5, navyColor);
    } else {
      drawTextRightAligned(page1, '(Continued on Page 2)', 675, 779.5, regularFont, 9, blueColor);
    }

    // --- Notes Box (x=32 to 362, y=802 to 945) ---
    if (doc.notes) {
      drawTextWrappedLines(page1, doc.notes, 48, 846, 300, regularFont, 9, navyColor, 13, 5);
    }
  }

  // ==========================================
  // PAGE 2 (CONTINUATION IF ITEMS > CAPACITY)
  // ==========================================
  if (needsPage2) {
    const page2 = pdfDoc.addPage([a4Width, a4Height]);
    const p2Items = items.slice(maxRowsPage1);

    // Page 2 top header bar
    page2.drawRectangle({
      x: 0,
      y: a4Height - 50,
      width: a4Width,
      height: 50,
      color: rgb(0.06, 0.09, 0.16),
    });

    page2.drawText(`${org.name} — ${isInvoice ? 'INVOICE' : 'BILL'} (CONTINUED)`, {
      x: 30,
      y: a4Height - 32,
      size: 13,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    page2.drawText(`Document: ${doc.documentNumber}   |   Date: ${formatDateDisplay(doc.documentDate)}`, {
      x: 30,
      y: a4Height - 65,
      size: 9.5,
      font: regularFont,
      color: navyColor,
    });

    // Continuation Table Header
    const p2TableY = a4Height - 95;
    page2.drawRectangle({
      x: 30,
      y: p2TableY - 24,
      width: a4Width - 60,
      height: 24,
      color: rgb(0.06, 0.09, 0.16),
    });

    page2.drawText('Sr.', { x: 38, y: p2TableY - 17, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    page2.drawText('Service / Description', { x: 80, y: p2TableY - 17, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    if (isBill) {
      page2.drawText('Duration', { x: 350, y: p2TableY - 17, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    }
    page2.drawText('Amount (₹)', { x: a4Width - 110, y: p2TableY - 17, size: 9, font: boldFont, color: rgb(1, 1, 1) });

    let currentY = p2TableY - 24;
    const p2RowHeight = 36;

    p2Items.forEach((item) => {
      currentY -= p2RowHeight;
      page2.drawRectangle({
        x: 30,
        y: currentY,
        width: a4Width - 60,
        height: p2RowHeight,
        borderWidth: 0.5,
        borderColor: rgb(0.85, 0.88, 0.92),
      });

      page2.drawText(String(item.srNo), { x: 42, y: currentY + 12, size: 9.5, font: regularFont, color: navyColor });
      page2.drawText(item.name, { x: 80, y: currentY + 14, size: 9.5, font: boldFont, color: navyColor });
      if (item.description) {
        page2.drawText(item.description.slice(0, 55), { x: 80, y: currentY + 3, size: 8, font: regularFont, color: rgb(0.4, 0.45, 0.5) });
      }
      if (isBill && item.duration) {
        page2.drawText(item.duration, { x: 350, y: currentY + 12, size: 9, font: regularFont, color: navyColor });
      }
      page2.drawText(formatINR(item.amount), { x: a4Width - 100, y: currentY + 12, size: 9.5, font: boldFont, color: navyColor });
    });

    // Total Amount Row on Page 2
    currentY -= 28;
    page2.drawRectangle({
      x: 30,
      y: currentY,
      width: a4Width - 60,
      height: 28,
      color: rgb(0.91, 0.94, 0.98),
      borderWidth: 0.5,
      borderColor: rgb(0.85, 0.88, 0.92),
    });
    page2.drawText('Total Amount', { x: 220, y: currentY + 9, size: 10, font: boldFont, color: navyColor });
    page2.drawText(formatINR(doc.payment.totalAmount), { x: a4Width - 110, y: currentY + 9, size: 11, font: boldFont, color: navyColor });

    // Payment Summary & Declaration on Page 2
    if (isInvoice) {
      currentY -= 110;
      page2.drawRectangle({
        x: 30,
        y: currentY,
        width: 250,
        height: 95,
        borderWidth: 0.5,
        borderColor: rgb(0.85, 0.88, 0.92),
      });
      page2.drawText('PAYMENT SUMMARY', { x: 40, y: currentY + 75, size: 9.5, font: boldFont, color: navyColor });
      page2.drawText(`Total Amount: ${formatINR(doc.payment.totalAmount)}`, { x: 40, y: currentY + 58, size: 9, font: boldFont, color: navyColor });
      page2.drawText(`Amount Paid: ${formatINR(doc.payment.amountPaid)}`, { x: 40, y: currentY + 42, size: 9, font: regularFont, color: navyColor });
      page2.drawText(`Balance: ${formatINR(doc.payment.balanceAmount)}`, { x: 40, y: currentY + 26, size: 9, font: boldFont, color: navyColor });
      page2.drawText(`Status: ${doc.payment.status}`, { x: 40, y: currentY + 10, size: 9, font: boldFont, color: blueColor });

      // Declaration box on Page 2
      page2.drawRectangle({
        x: 295,
        y: currentY,
        width: a4Width - 325,
        height: 95,
        borderWidth: 0.5,
        borderColor: rgb(0.85, 0.88, 0.92),
      });
      page2.drawText('DECLARATION', { x: 305, y: currentY + 75, size: 9, font: boldFont, color: navyColor });
      const declaration = doc.declarationText || getDeclarationText(doc.payment.status, org.declarationPresets);
      drawTextWrappedLines(page2, declaration, (305 / scaleX), (template.canvasHeight - ((currentY + 60) / scaleY)), 220, regularFont, 8, navyColor, 11, 4);
    }

    // Page 2 Footer
    page2.drawRectangle({
      x: 0,
      y: 0,
      width: a4Width,
      height: 35,
      color: rgb(0.06, 0.09, 0.16),
    });
    page2.drawText(`${org.website}   |   ${org.email}   |   ${org.phone}   |   ${org.location}`, {
      x: 40,
      y: 13,
      size: 8,
      font: regularFont,
      color: rgb(0.8, 0.85, 0.9),
    });
  }

  // Helper functions for precise typography placement
  function drawTextAtCenterY(page: PDFPage, text: string, canvasX: number, centerCanvasY: number, font: PDFFont, fontSize: number, color: any) {
    if (!text) return;
    const px = toPdfX(canvasX);
    const py = toPdfBaselineY(centerCanvasY, fontSize);
    const scaledSize = toPdfSize(fontSize);
    page.drawText(text, { x: px, y: py, size: scaledSize, font, color });
  }

  function drawTextCenteredAt(page: PDFPage, text: string, centerCanvasX: number, centerCanvasY: number, font: PDFFont, fontSize: number, color: any) {
    if (!text) return;
    const scaledSize = toPdfSize(fontSize);
    const textWidth = font.widthOfTextAtSize(text, scaledSize);
    const px = toPdfX(centerCanvasX) - textWidth / 2;
    const py = toPdfBaselineY(centerCanvasY, fontSize);
    page.drawText(text, { x: px, y: py, size: scaledSize, font, color });
  }

  function drawTextRightAligned(page: PDFPage, text: string, rightCanvasX: number, centerCanvasY: number, font: PDFFont, fontSize: number, color: any) {
    if (!text) return;
    const scaledSize = toPdfSize(fontSize);
    const textWidth = font.widthOfTextAtSize(text, scaledSize);
    const px = toPdfX(rightCanvasX) - textWidth;
    const py = toPdfBaselineY(centerCanvasY, fontSize);
    page.drawText(text, { x: px, y: py, size: scaledSize, font, color });
  }

  function drawTextWrappedLines(
    page: PDFPage,
    text: string,
    canvasX: number,
    startCanvasY: number,
    maxCanvasWidth: number,
    font: PDFFont,
    fontSize: number,
    color: any,
    lineHeight = 12,
    maxLines = 4
  ) {
    if (!text) return;
    const scaledSize = toPdfSize(fontSize);
    const scaledMaxWidth = toPdfX(maxCanvasWidth);

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, scaledSize);
      if (testWidth <= scaledMaxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
        if (lines.length >= maxLines) break;
      }
    }
    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }

    lines.forEach((line, index) => {
      const lineCenterY = startCanvasY + index * lineHeight;
      const py = toPdfBaselineY(lineCenterY, fontSize);
      page.drawText(line, {
        x: toPdfX(canvasX),
        y: py,
        size: scaledSize,
        font,
        color,
      });
    });
  }

  function drawVectorCheckmark(page: PDFPage, boxX: number, boxY: number, boxSize = 15) {
    const px = toPdfX(boxX);
    const py = (template.canvasHeight - (boxY + boxSize)) * scaleY;
    const pSize = toPdfSize(boxSize);

    // Vector checkmark inside square
    page.drawLine({
      start: { x: px + pSize * 0.22, y: py + pSize * 0.50 },
      end: { x: px + pSize * 0.44, y: py + pSize * 0.25 },
      thickness: 2.2,
      color: blueColor,
    });

    page.drawLine({
      start: { x: px + pSize * 0.44, y: py + pSize * 0.25 },
      end: { x: px + pSize * 0.82, y: py + pSize * 0.78 },
      thickness: 2.2,
      color: blueColor,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
