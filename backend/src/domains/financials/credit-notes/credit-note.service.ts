import prisma from "../../../config/database.js";
const p: any = prisma;
import ApiError from "../../../utils/ApiError.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, auditService } from "../../../services/audit/index.js";
import { creditNoteRepository } from "./credit-note.repository.js";
import { CreateCreditNoteInput, ApplyCreditNoteInput } from "./credit-note.types.js";
import { customerQueryService } from "../../contacts/customers/customer.query-service.js";
import { productQueryService } from "../../inventory/products/product.query-service.js";

const generateCreditNoteNumber = async (organizationId: string) => {
  const count = await p.creditNote.count({ where: { organizationId } });
  return `CN-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
};

export const creditNoteService = {
  createCreditNote: async (
    organizationId: string,
    actorUserId: string,
    payload: CreateCreditNoteInput
  ) => {
    const customer = await customerQueryService.findById(organizationId, payload.customerId);
    if (!customer) throw new ApiError(404, "Customer not found");

    if (!payload.items || payload.items.length === 0) {
      throw new ApiError(400, "Credit note must have at least one item");
    }

    const products = await productQueryService.findManyByIdsWithTax(
      organizationId, 
      payload.items.map((i) => i.productId)
    );

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let taxAmount = 0;
    const lineItems = payload.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new ApiError(404, `Product ${item.productId} not found`);

      const price = item.unitPrice > 0 ? item.unitPrice : Number(product.sellingPrice);
      const lineTotalExclTax = price * item.quantity;
      subtotal += lineTotalExclTax;

      const taxRate = item.taxRate !== undefined ? item.taxRate : Number(product.tax?.rate ?? 0);
      const lineTax = lineTotalExclTax * (taxRate / 100);
      taxAmount += lineTax;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: price,
        taxAmount: lineTax,
        lineTotal: lineTotalExclTax + lineTax,
      };
    });

    const totalAmount = subtotal + taxAmount;
    const status = payload.status ?? "DRAFT";

    const creditNote = await prisma.$transaction(async (tx) => {
      const creditNoteNumber = await generateCreditNoteNumber(organizationId);

      const created = await creditNoteRepository.createCreditNoteWithItems(tx, organizationId, {
        customerId: payload.customerId,
        creditNoteNumber,
        status,
        issueDate: new Date(payload.issueDate),
        subtotal,
        taxAmount,
        totalAmount,
        unappliedAmount: totalAmount,
        notes: payload.notes,
        items: lineItems,
      });

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: "CREDIT_NOTE_CREATED" as any,
          entityType: "creditNote" as any,
          entityId: created.id,
        },
        tx
      );

      return created;
    });

    return creditNote;
  },

  applyCreditNote: async (
    organizationId: string,
    actorUserId: string,
    creditNoteId: string,
    payload: ApplyCreditNoteInput
  ) => {
    return prisma.$transaction(async (tx) => {
      const creditNote = await (tx as any).creditNote.findFirst({
        where: { id: creditNoteId, organizationId },
      });
      if (!creditNote) throw new ApiError(404, "Credit Note not found");

      if (creditNote.status !== "POSTED") {
        throw new ApiError(400, "Can only apply POSTED credit notes");
      }

      let totalToApply = 0;
      for (const app of payload.applications) {
        if (app.appliedAmount <= 0) throw new ApiError(400, "Application amount must be > 0");
        totalToApply += app.appliedAmount;
      }

      if (totalToApply > Number(creditNote.unappliedAmount)) {
        throw new ApiError(400, "Cannot apply more than unapplied amount of Credit Note");
      }

      for (const app of payload.applications) {
        const invoice = await tx.invoice.findFirst({
          where: { id: app.invoiceId, organizationId, deletedAt: null },
        });
        if (!invoice) throw new ApiError(404, `Invoice ${app.invoiceId} not found`);

        if (Number((invoice as any).amountDue) < app.appliedAmount) {
          throw new ApiError(400, `Cannot apply ${app.appliedAmount} to invoice ${invoice.invoiceNumber}. Only ${(invoice as any).amountDue} due.`);
        }

        await creditNoteRepository.applyCreditNote(tx, organizationId, creditNote.id, invoice.id, app.appliedAmount);

        const newDue = Number((invoice as any).amountDue) - app.appliedAmount;
        if (newDue <= 0) {
          await tx.invoice.update({ where: { id: invoice.id }, data: { status: "PAID" } });
        } else {
          await tx.invoice.update({ where: { id: invoice.id }, data: { status: "PARTIALLY_PAID" } });
        }
      }

      // Update credit note unapplied amount
      const newUnapplied = Number(creditNote.unappliedAmount) - totalToApply;
      await (tx as any).creditNote.update({
        where: { id: creditNote.id },
        data: { unappliedAmount: newUnapplied },
      });

      return { success: true };
    });
  },

  listCreditNotes: async (organizationId: string, query: Record<string, unknown>) => {
    return creditNoteRepository.listCreditNotes(organizationId, query);
  },
};
