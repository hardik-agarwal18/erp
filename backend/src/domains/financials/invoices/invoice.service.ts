
import { Prisma } from "@prisma/client";

import prisma from "../../../config/database.js";
import type { DatabaseTransactionClient } from "../../../config/database.js";
import ApiError from "../../../utils/ApiError.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../../services/audit/index.js";
import { pdfGenerationQueue } from "../../../queue/queue.service.js";
import { invoiceRepository } from "./invoice.repository.js";
import { CreateInvoiceInput, UpdateInvoiceInput } from "./invoice.types.js";
import { invoicePdfService } from "./services/invoice-pdf.service.js";


const formatInvoiceNumber = (prefix: string, value: number) =>
  `${prefix}-${String(value).padStart(6, "0")}`;

const reserveInvoiceNumber = async (
  tx: DatabaseTransactionClient,
  organizationId: string,
) => {
  const sequence = await tx.invoiceSequence.upsert({
    where: { organizationId },
    update: { nextNumber: { increment: 1 } },
    create: { organizationId, nextNumber: 2 },
  });

  const nextNumber = sequence.nextNumber - 1;
  return formatInvoiceNumber(sequence.prefix, nextNumber);
};

const assertCustomer = async (organizationId: string, customerId: string) => {
  const customer = await invoiceRepository.findCustomerById(
    organizationId,
    customerId,
  );
  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }
};

export const invoiceService = {
  createInvoice: async (
    organizationId: string,
    actorUserId: string,
    payload: CreateInvoiceInput,
  ) => {
    await assertCustomer(organizationId, payload.customerId);

    const productIds = payload.items.map((item) => item.productId);
    const uniqueProductIds = Array.from(new Set(productIds));
    const products = await invoiceRepository.findProductsByIds(
      organizationId,
      uniqueProductIds,
    );

    if (products.length !== uniqueProductIds.length) {
      throw new ApiError(400, "One or more products were not found");
    }

    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    const lineItems = payload.items.map((item) => {
      const product = productById.get(item.productId)!;
      const unitPrice = item.unitPrice ?? Number(product.sellingPrice);
      const discountAmount = item.discountAmount ?? 0;
      const lineSubtotal = unitPrice * item.quantity;
      const taxableAmount = Math.max(lineSubtotal - discountAmount, 0);
      const taxRate = product.tax ? Number(product.tax.rate) : 0;
      const taxAmount = (taxableAmount * taxRate) / 100;
      const lineTotal = taxableAmount + taxAmount;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        discountAmount,
        taxAmount,
        lineTotal,
        lineSubtotal,
        productType: product.type,
      };
    });

    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.lineSubtotal,
      0,
    );
    const discountAmount = lineItems.reduce(
      (sum, item) => sum + item.discountAmount,
      0,
    );
    const taxAmount = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = lineItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );
    const status = payload.status ?? "DRAFT";

    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await reserveInvoiceNumber(tx, organizationId);
      const created = await invoiceRepository.createInvoiceWithItems(
        tx,
        organizationId,
        {
          customerId: payload.customerId,
          invoiceNumber,
          status,
          issueDate: new Date(payload.issueDate),
          dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          notes: payload.notes,
          items: lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxAmount: item.taxAmount,
            discountAmount: item.discountAmount,
            lineTotal: item.lineTotal,
          })),
        },
      );

      let totalCogs = 0;

      if (status === "ISSUED") {
        for (const item of lineItems) {
          if (item.productType !== "PHYSICAL") {
            continue;
          }
          const inventory = await invoiceRepository.findInventoryItemForProduct(
            tx,
            organizationId,
            item.productId,
          );
          if (!inventory || Number(inventory.quantity) < item.quantity) {
            throw new ApiError(400, "Insufficient stock for invoice item");
          }

          const unitCost = Number(inventory.averageCost) || 0;
          totalCogs += unitCost * item.quantity;

          await invoiceRepository.decrementInventoryItem(
            tx,
            organizationId,
            inventory.id,
            item.quantity,
          );

          await invoiceRepository.createInventoryMovement(tx, organizationId, {
            productId: item.productId,
            type: "SALE",
            quantity: item.quantity,
            referenceId: created.id,
          });
        }
      }

      await invoiceRepository.createFinancialTransaction(tx, organizationId, {
        type: "SALE",
        referenceType: "invoice",
        referenceId: created.id,
        amount: totalAmount,
        description: `Invoice ${invoiceNumber} created`,
      });

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.INVOICE_CREATED,
          entityType: AUDIT_ENTITY_TYPES.INVOICE,
          entityId: created.id,
        },
        tx,
      );

      if (status === "ISSUED") {
        await pdfGenerationQueue.add("generate-invoice-pdf", {
          documentId: created.id,
          documentType: "INVOICE",
          organizationId,
        });

        // Fire Accounting Event via Outbox
        await (tx as any).outboxEvent.create({
          data: {
            organizationId,
            aggregateType: "SalesInvoice",
            aggregateId: created.id,
            eventType: "SalesInvoiceIssued",
            payload: {
              invoiceId: created.id,
              invoiceNumber: invoiceNumber,
              customerId: payload.customerId,
              subtotal,
              taxAmount,
              totalAmount,
              currency: "INR",
              issuedAt: created.issueDate.toISOString(),
              cogsAmount: totalCogs,
            },
          },
        });
      }

      return created;
    });

    return invoiceRepository.findById(organizationId, invoice.id);
  },

  updateInvoice: async (
    organizationId: string,
    actorUserId: string,
    invoiceId: string,
    payload: UpdateInvoiceInput,
  ) => {
    const existing = await invoiceRepository.findById(organizationId, invoiceId);
    if (!existing) {
      throw new ApiError(404, "Invoice not found");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const nextStatus = payload.status ?? existing.status;

      const updatedCount = await invoiceRepository.updateInvoiceForOrganization(
        tx,
        organizationId,
        invoiceId,
        {
          status: nextStatus,
          dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
          notes: payload.notes,
        },
      );

      if (updatedCount.count !== 1) {
        throw new ApiError(404, "Invoice not found");
      }

      if (existing.status === "DRAFT" && nextStatus === "ISSUED") {
        let totalCogs = 0;
        const items = await invoiceRepository.listInvoiceItems(tx, invoiceId);
        for (const item of items) {
          if (item.product.type !== "PHYSICAL") {
            continue;
          }
          const inventory = await invoiceRepository.findInventoryItemForProduct(
            tx,
            organizationId,
            item.productId,
          );
          if (
            !inventory ||
            Number(inventory.quantity) < Number(item.quantity)
          ) {
            throw new ApiError(400, "Insufficient stock for invoice item");
          }

          const unitCost = Number(inventory.averageCost) || 0;
          totalCogs += unitCost * Number(item.quantity);

          await invoiceRepository.decrementInventoryItem(
            tx,
            organizationId,
            inventory.id,
            Number(item.quantity),
          );
          await invoiceRepository.createInventoryMovement(tx, organizationId, {
            productId: item.productId,
            type: "SALE",
            quantity: Number(item.quantity),
            referenceId: invoiceId,
          });
        }
        
        await pdfGenerationQueue.add("generate-invoice-pdf", {
          documentId: invoiceId,
          documentType: "INVOICE",
          organizationId,
        });

        // Fire Accounting Event via Outbox
        await (tx as any).outboxEvent.create({
          data: {
            organizationId,
            aggregateType: "SalesInvoice",
            aggregateId: invoiceId,
            eventType: "SalesInvoiceIssued",
            payload: {
              invoiceId: invoiceId,
              invoiceNumber: existing.invoiceNumber,
              customerId: existing.customerId,
              subtotal: Number(existing.subtotal),
              taxAmount: Number(existing.taxAmount),
              totalAmount: Number(existing.totalAmount),
              currency: "INR",
              issuedAt: new Date().toISOString(),
              cogsAmount: totalCogs,
            },
          },
        });
      }

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.INVOICE_UPDATED,
          entityType: AUDIT_ENTITY_TYPES.INVOICE,
          entityId: invoiceId,
        },
        tx,
      );

      return { id: invoiceId };
    });

    return invoiceRepository.findById(organizationId, updated.id);
  },

  listInvoices: (
    organizationId: string,
    filters: { status?: string; search?: string },
    query: Record<string, unknown>,
  ) => {
    return invoiceRepository.listInvoices(organizationId, filters, query);
  },

  getInvoice: async (organizationId: string, invoiceId: string) => {
    const invoice = await invoiceRepository.findById(organizationId, invoiceId);
    if (!invoice) throw new ApiError(404, "Invoice not found");
    return invoice;
  },

  deleteInvoice: async (
    organizationId: string,
    actorUserId: string,
    invoiceId: string,
  ) => {
    const existing = await invoiceRepository.findById(organizationId, invoiceId);
    if (!existing) throw new ApiError(404, "Invoice not found");
    if (existing.status !== "DRAFT") throw new ApiError(400, "Only DRAFT invoices can be deleted");

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { deletedAt: new Date() },
    });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.INVOICE_DELETED,
      entityType: AUDIT_ENTITY_TYPES.INVOICE,
      entityId: invoiceId,
    });
  },

  exportInvoicePdf: async (organizationId: string, invoiceId: string) => {
    // Generate PDF buffer
    return invoicePdfService.generateInvoicePdf({
      invoiceId,
      organizationId,
    });
  },

  sendInvoiceEmail: async (organizationId: string, invoiceId: string, email: string) => {
    const invoice = await invoiceService.getInvoice(organizationId, invoiceId);
    if (!invoice) throw new ApiError(404, "Invoice not found");

    // Create pending log
    const emailLog = await prisma.invoiceEmailLog.create({
      data: {
        invoiceId,
        organizationId,
        recipient: email,
        status: "PENDING",
      },
    });

    await pdfGenerationQueue.add("generate-invoice-pdf", {
      documentId: invoiceId,
      documentType: "INVOICE",
      organizationId,
      targetEmail: email,
      emailLogId: emailLog.id,
    });

    return { success: true };
  },

  getInvoiceEmailHistory: async (organizationId: string, invoiceId: string) => {
    const logs = await prisma.invoiceEmailLog.findMany({
      where: {
        invoiceId,
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        recipient: true,
        status: true,
        error: true,
        sentAt: true,
        openedAt: true,
        createdAt: true,
      },
    });
    return logs;
  },
};

