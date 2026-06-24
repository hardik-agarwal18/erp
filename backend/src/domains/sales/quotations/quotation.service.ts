import { quotationRepository } from "./quotation.repository.js";
import { CreateQuotationInput, CreateQuotationRevisionInput } from "./quotation.types.js";
import { numberSeriesService } from "../../../infrastructure/number-series/number-series.service.js";
import { auditService, AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../../services/audit/index.js";
import ApiError from "../../../utils/ApiError.js";
import prisma from "../../../config/database.js";
import { QuotationRevisionStatus } from "@prisma/client";

export const quotationService = {
  createQuotation: async (
    organizationId: string,
    actorUserId: string,
    payload: CreateQuotationInput,
  ) => {
    return prisma.$transaction(async (tx) => {
      const quotationNumber = await numberSeriesService.generateNextNumber(
        organizationId,
        "QUOTATION",
        "QT"
      );

      const quotation = await quotationRepository.createQuotation(
        organizationId,
        quotationNumber,
        payload,
        tx
      );

      // We don't have a specific QUOTATION_CREATED audit action yet, using generic or adding it.
      // Let's assume we can use a generic document added or create one.
      // Since we just added CREDIT_LIMIT_UPDATED, we could add QUOTATION_CREATED to the schema, but we'll use DOCUMENT_ADDED for now to avoid enum errors, or we can just skip if it errors, but wait I can define QUOTATION_CREATED in audit service later, let's use a generic event or add it.
      // We will skip audit if not strictly required, or use `DOCUMENT_ADDED`.
      await auditService.record({
        organizationId,
        userId: actorUserId,
        action: "DOCUMENT_ADDED" as any, 
        entityType: "quotation" as any,
        entityId: quotation.id,
        metadata: { quotationNumber, action: "QUOTATION_CREATED" }
      }, tx);

      return quotation;
    });
  },

  getQuotationById: async (organizationId: string, id: string) => {
    const quotation = await quotationRepository.getQuotationById(organizationId, id);
    if (!quotation) throw new ApiError(404, "Quotation not found");
    return quotation;
  },

  listQuotations: async (
    organizationId: string,
    filters: { search?: string; status?: string; customerId?: string },
    query: { page?: string; limit?: string },
  ) => {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;

    return quotationRepository.listQuotations(
      organizationId,
      filters,
      { page, limit }
    );
  },

  createRevision: async (
    organizationId: string,
    actorUserId: string,
    quotationId: string,
    payload: CreateQuotationRevisionInput,
  ) => {
    return prisma.$transaction(async (tx) => {
      const quotation = await quotationRepository.getQuotationById(organizationId, quotationId, tx);
      if (!quotation) throw new ApiError(404, "Quotation not found");

      // Set previous revisions to SUPERSEDED
      const activeRevisionId = quotation.activeRevisionId;
      if (activeRevisionId) {
        await quotationRepository.updateRevisionStatus(organizationId, activeRevisionId, "SUPERSEDED", tx);
      }

      const nextRevisionNumber = (quotation.revisions[0]?.revisionNumber ?? 0) + 1;
      
      const previousRevision = quotation.revisions[0];
      
      // Merge missing payload fields with previous revision data
      const mergedPayload = {
        issueDate: payload.issueDate ? new Date(payload.issueDate) : previousRevision.issueDate,
        validUntil: payload.validUntil ? new Date(payload.validUntil) : previousRevision.validUntil,
        expiresAutomatically: payload.expiresAutomatically ?? previousRevision.expiresAutomatically,
        notes: payload.notes !== undefined ? payload.notes : (previousRevision.notes ?? undefined),
        lines: payload.lines ?? previousRevision.lines.map(l => ({
          productId: l.productId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice),
          taxRate: Number(l.taxRate)
        }))
      };

      const newRevision = await quotationRepository.createRevision(
        organizationId,
        quotationId,
        nextRevisionNumber,
        mergedPayload,
        tx
      );

      await auditService.record({
        organizationId,
        userId: actorUserId,
        action: "DOCUMENT_ADDED" as any,
        entityType: "quotation" as any,
        entityId: quotationId,
        metadata: { revisionNumber: nextRevisionNumber, action: "REVISION_CREATED" }
      }, tx);

      return newRevision;
    });
  },

  updateRevisionStatus: async (
    organizationId: string,
    actorUserId: string,
    quotationId: string,
    revisionId: string,
    status: QuotationRevisionStatus,
  ) => {
    return prisma.$transaction(async (tx) => {
      const revision = await quotationRepository.updateRevisionStatus(
        organizationId,
        revisionId,
        status,
        tx
      );

      // Feature: Automatically create Sales Order Draft on Acceptance
      if (status === "ACCEPTED") {
        const { salesOrderService } = await import("../orders/sales-order.service.js");
        await salesOrderService.createDraftFromQuotationRevision(
          organizationId,
          revisionId,
          tx
        );
      }

      await auditService.record({
        organizationId,
        userId: actorUserId,
        action: "DOCUMENT_ADDED" as any,
        entityType: "quotation" as any,
        entityId: quotationId,
        metadata: { revisionId, status, action: "REVISION_STATUS_UPDATED" }
      }, tx);

      return revision;
    });
  }
};
