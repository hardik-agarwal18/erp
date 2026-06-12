
import PDFDocument from "pdfkit";
import { invoiceService } from "../invoice.service.js";
import { env } from "../../../../config/env.js";
import prisma from "../../../../config/database.js";

export const invoicePdfService = {
  generateInvoicePdf: async ({
    invoiceId,
    organizationId,
  }: {
    invoiceId: string;
    organizationId: string;
  }): Promise<Buffer> => {
    const invoice = await invoiceService.getInvoice(organizationId, invoiceId);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on("data", (buffer) => buffers.push(buffer));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // Header
        doc
          .fontSize(20)
          .text(invoice.organizationId, 50, 50)
          .fontSize(10)
          .text("INVOICE", 400, 50, { align: "right" });

        // Invoice Info
        doc
          .fontSize(10)
          .text(`Invoice Number: ${invoice.invoiceNumber}`, 400, 70, { align: "right" })
          .text(`Issue Date: ${invoice.issueDate.toISOString().split("T")[0]}`, 400, 85, { align: "right" })
          .text(`Due Date: ${invoice.dueDate ? invoice.dueDate.toISOString().split("T")[0] : "N/A"}`, 400, 100, { align: "right" });

        // Bill To
        doc
          .fontSize(12)
          .text("Bill To:", 50, 120)
          .fontSize(10)
          .text(invoice.customer.name, 50, 135);

        if (invoice.customer.address) {
          doc.text(invoice.customer.address, 50, 150);
        }

        // Line Items Header
        let y = 200;
        doc
          .fontSize(10)
          .text("Description", 50, y)
          .text("Quantity", 280, y, { width: 60, align: "right" })
          .text("Unit Price", 360, y, { width: 80, align: "right" })
          .text("Amount", 460, y, { width: 80, align: "right" });

        doc.moveTo(50, y + 15).lineTo(540, y + 15).stroke();
        y += 25;

        // Line Items
        invoice.items.forEach((item: any) => {
          doc
            .text(item.product.name, 50, y)
            .text(item.quantity.toString(), 280, y, { width: 60, align: "right" })
            .text(item.unitPrice.toString(), 360, y, { width: 80, align: "right" })
            .text(item.lineTotal.toString(), 460, y, { width: 80, align: "right" });
          y += 20;
        });

        // Totals
        y += 20;
        doc.moveTo(350, y).lineTo(540, y).stroke();
        y += 10;

        doc
          .text("Subtotal:", 350, y, { width: 90, align: "right" })
          .text(invoice.subtotal.toString(), 460, y, { width: 80, align: "right" });
        y += 20;

        doc
          .text("Tax:", 350, y, { width: 90, align: "right" })
          .text(invoice.taxAmount.toString(), 460, y, { width: 80, align: "right" });
        y += 20;

        doc
          .text("Total:", 350, y, { width: 90, align: "right" })
          .text(invoice.totalAmount.toString(), 460, y, { width: 80, align: "right" });

        // Notes
        if (invoice.notes) {
          y += 50;
          doc.fontSize(10).text("Notes:", 50, y).text(invoice.notes, 50, y + 15);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  },
};
