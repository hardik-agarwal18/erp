import prisma from "../../../../config/database.js";
const p: any = prisma;
import ApiError from "../../../../utils/ApiError.js";
import { parsePagination } from "../../../../shared/utils/pagination.js";
import { CreateRfqInput, SubmitVendorResponseInput, AwardRfqInput } from "./rfq.types.js";
import { Decimal } from "@prisma/client/runtime/library.js";

const generateRfqNumber = async (organizationId: string) => {
  const count = await p.requestForQuotation.count({ where: { organizationId } });
  return `RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
};

const generatePoNumber = async (organizationId: string) => {
  const count = await prisma.purchaseOrder.count({ where: { organizationId } });
  return `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
};

export const rfqService = {
  createRfq: async (organizationId: string, actorUserId: string, payload: CreateRfqInput) => {
    if (!payload.items || payload.items.length === 0) {
      throw new ApiError(400, "RFQ must have at least one item");
    }

    if (!payload.vendorIds || payload.vendorIds.length === 0) {
      throw new ApiError(400, "RFQ must have at least one invited vendor");
    }

    const rfqNumber = await generateRfqNumber(organizationId);

    return prisma.$transaction(async (tx) => {
      const rfq = await (tx as any).requestForQuotation.create({
        data: {
          organizationId,
          rfqNumber,
          requisitionId: payload.requisitionId,
          issueDate: payload.issueDate,
          submissionDeadline: payload.submissionDeadline,
          notes: payload.notes,
          status: "PUBLISHED", // Skip DRAFT for simplicity here
          items: {
            create: payload.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              requiredDate: item.requiredDate,
              notes: item.notes,
            })),
          },
          vendors: {
            create: payload.vendorIds.map((vendorId) => ({
              vendorId,
              status: "PENDING",
            })),
          },
        },
        include: { items: true, vendors: true },
      });

      return rfq;
    });
  },

  submitVendorResponse: async (organizationId: string, rfqId: string, payload: SubmitVendorResponseInput) => {
    return prisma.$transaction(async (tx) => {
      const rfqVendor = await (tx as any).requestForQuotationVendor.findUnique({
        where: { rfqId_vendorId: { rfqId, vendorId: payload.vendorId } },
        include: { rfq: true },
      });

      if (!rfqVendor) throw new ApiError(404, "Vendor was not invited to this RFQ");
      if (rfqVendor.rfq.status !== "PUBLISHED") throw new ApiError(400, "RFQ is not open for responses");

      const response = await (tx as any).vendorQuotationResponse.create({
        data: {
          rfqId,
          rfqVendorId: rfqVendor.id,
          vendorId: payload.vendorId,
          totalAmount: payload.totalAmount,
          taxAmount: payload.taxAmount,
          leadTimeDays: payload.leadTimeDays,
          validUntil: payload.validUntil,
          notes: payload.notes,
          items: {
            create: payload.items.map((item: any) => ({
              rfqItemId: item.rfqItemId,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              totalPrice: Number(item.unitPrice) * Number(item.quantity) + (item.taxRate ? (Number(item.unitPrice) * Number(item.quantity) * Number(item.taxRate)) / 100 : 0),
            })),
          },
        },
      });

      await (tx as any).requestForQuotationVendor.update({
        where: { id: rfqVendor.id },
        data: { status: "RESPONDED" },
      });

      return response;
    });
  },

  compareVendors: async (organizationId: string, rfqId: string) => {
    const rfq = await p.requestForQuotation.findFirst({
      where: { id: rfqId, organizationId },
      include: {
        responses: {
          include: {
            vendor: { select: { id: true, name: true, rating: true } },
            items: {
              include: {
                product: { select: { id: true, name: true, sku: true } },
              },
            },
          },
        },
      },
    });

    if (!rfq) throw new ApiError(404, "RFQ not found");

    // Map and score responses
    const comparisons = rfq.responses.map((resp: any) => {
      const totalAmount = Number(resp.totalAmount);
      const leadTime = resp.leadTimeDays || 999;
      const rating = resp.vendor.rating || 3.0; // Default to 3/5 if unknown
      
      // Weights
      const priceWeight = 0.50;
      const leadTimeWeight = 0.30;
      const ratingWeight = 0.20;

      // Base price multiplier (assumes lower is better, penalize by adding to score)
      // Normalize values roughly (lead time in days, rating max 5)
      const normalizedPrice = totalAmount; 
      const normalizedLeadTime = leadTime * 1000; // 1 day = 1000 weight 
      const normalizedRatingPenalty = (5 - rating) * 2000; // Lower rating = higher penalty

      const score = (normalizedPrice * priceWeight) + (normalizedLeadTime * leadTimeWeight) + (normalizedRatingPenalty * ratingWeight);

      return {
        responseId: resp.id,
        vendorId: resp.vendorId,
        vendorName: resp.vendor.name,
        vendorRating: rating,
        totalAmount,
        taxAmount: Number(resp.taxAmount || 0),
        leadTimeDays: resp.leadTimeDays,
        validUntil: resp.validUntil,
        score,
        items: resp.items.map((i: any) => ({
          productId: i.productId,
          productName: i.product.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        }))
      };
    });

    comparisons.sort((a: any, b: any) => a.score - b.score);

    return {
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      comparisons,
    };
  },

  awardRfq: async (organizationId: string, actorUserId: string, rfqId: string, payload: AwardRfqInput) => {
    return prisma.$transaction(async (tx) => {
      const rfq = await (tx as any).requestForQuotation.findFirst({
        where: { id: rfqId, organizationId },
      });
      if (!rfq) throw new ApiError(404, "RFQ not found");
      if (rfq.status !== "PUBLISHED") throw new ApiError(400, "RFQ is not in a publishable/open state");

      const response = await (tx as any).vendorQuotationResponse.findFirst({
        where: { id: payload.responseId, rfqId },
        include: { items: true },
      });
      if (!response) throw new ApiError(404, "Vendor response not found for this RFQ");

      // Mark RFQ Awarded
      await (tx as any).requestForQuotation.update({
        where: { id: rfqId },
        data: { status: "AWARDED" },
      });

      // Mark Response Awarded
      await (tx as any).vendorQuotationResponse.update({
        where: { id: response.id },
        data: { 
          isAwarded: true,
          awardedReason: payload.awardedReason,
        },
      });

      await (tx as any).vendorQuotationResponseItem.updateMany({
        where: { responseId: response.id },
        data: { isAwarded: true },
      });

      // Generate Purchase Order Draft
      const poNumber = await generatePoNumber(organizationId);
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          organizationId,
          vendorId: response.vendorId,
          poNumber,
          status: "DRAFT",
          issueDate: new Date(),
          notes: payload.notes || `Auto-generated from awarded RFQ ${rfq.rfqNumber}`,
          totalAmount: response.totalAmount,
          items: {
            create: response.items.map((item: any) => {
              const taxAmt = item.taxRate ? (Number(item.unitPrice) * Number(item.quantity) * Number(item.taxRate)) / 100 : 0;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxAmount: taxAmt,
                lineTotal: item.totalPrice,
              };
            }),
          },
        },
      });

      return {
        message: "RFQ Awarded successfully",
        purchaseOrderId: purchaseOrder.id,
        purchaseOrderNumber: purchaseOrder.poNumber,
      };
    });
  },

  listRfqs: async (organizationId: string, query: Record<string, any>) => {
    const pagination = parsePagination(query);
    const where = { organizationId };

    const [items, total] = await prisma.$transaction([
      p.requestForQuotation.findMany({
        where,
        include: {
          vendors: { include: { vendor: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      p.requestForQuotation.count({ where }),
    ]);

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  },
};
