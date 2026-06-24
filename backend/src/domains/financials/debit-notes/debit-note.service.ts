import prisma from "../../../config/database.js";
const p: any = prisma;
import ApiError from "../../../utils/ApiError.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, auditService } from "../../../services/audit/index.js";
import { debitNoteRepository } from "./debit-note.repository.js";
import { CreateDebitNoteInput } from "./debit-note.types.js";
import { customerQueryService } from "../../contacts/customers/customer.query-service.js";
import { productQueryService } from "../../inventory/products/product.query-service.js";

const generateDebitNoteNumber = async (organizationId: string) => {
  const count = await p.debitNote.count({ where: { organizationId } });
  return `DN-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
};

export const debitNoteService = {
  createDebitNote: async (
    organizationId: string,
    actorUserId: string,
    payload: CreateDebitNoteInput
  ) => {
    const customer = await customerQueryService.findById(organizationId, payload.customerId);
    if (!customer) throw new ApiError(404, "Customer not found");

    if (!payload.items || payload.items.length === 0) {
      throw new ApiError(400, "Debit note must have at least one item");
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

    const debitNote = await prisma.$transaction(async (tx: any) => {
      const debitNoteNumber = await generateDebitNoteNumber(organizationId);

      const created = await debitNoteRepository.createDebitNoteWithItems(tx, organizationId, {
        customerId: payload.customerId,
        debitNoteNumber,
        status,
        issueDate: new Date(payload.issueDate),
        subtotal,
        taxAmount,
        totalAmount,
        notes: payload.notes,
        items: lineItems,
      });

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: "DEBIT_NOTE_CREATED" as any,
          entityType: "debitNote" as any,
          entityId: created.id,
        },
        tx
      );

      return created;
    });

    return debitNote;
  },

  listDebitNotes: async (organizationId: string, query: Record<string, unknown>) => {
    return debitNoteRepository.listDebitNotes(organizationId, query);
  },
};
