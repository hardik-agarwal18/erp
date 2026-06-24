import ApiError from "../../../utils/ApiError.js";
import { grnRepository } from "./grn.repository.js";
import { GRNFilters } from "./grn.types.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../../services/audit/index.js";
import prisma from "../../../config/database.js";
import { GoodsReceiptNoteStatus, RejectedItemDisposition } from "@prisma/client";

export const grnService = {
  createDraft: async (organizationId: string, actorUserId: string, payload: any) => {
    return prisma.$transaction(async (tx: any) => {
      const existing = await tx.goodsReceiptNote.findFirst({
        where: { grnNumber: payload.grnNumber, organizationId, deletedAt: null }
      });
      if (existing) throw new ApiError(400, "GRN with this number already exists");

      const godown = await tx.godown.findFirst({
        where: { id: payload.godownId, organizationId, deletedAt: null },
      });
      if (!godown) throw new ApiError(404, "Godown not found");

      if (payload.purchaseOrderId) {
        const po = await tx.purchaseOrder.findFirst({
          where: { id: payload.purchaseOrderId, organizationId },
          include: { items: true }
        });
        if (!po) throw new ApiError(404, "Purchase Order not found");
        if (po.status !== "APPROVED" && po.status !== "PARTIALLY_RECEIVED" && po.status !== "SENT") {
          throw new ApiError(400, `Cannot create GRN for PO in \${po.status} status.`);
        }

        // Validate PO tolerances
        const overTolerance = po.overReceiptTolerance ? Number(po.overReceiptTolerance) : 0;
        for (const item of payload.items) {
           const poItem = po.items.find((i: any) => i.id === item.poItemId);
           if (poItem) {
             const ordered = Number(poItem.quantity); // actually orderedQty or quantity depending on schema
             const alreadyReceived = Number(poItem.receivedQty);
             const attemptingToReceive = Number(item.receivedQty);
             const maxAllowed = ordered + (ordered * overTolerance / 100);
             if (alreadyReceived + attemptingToReceive > maxAllowed) {
                throw new ApiError(400, `Receiving \${attemptingToReceive} units exceeds PO tolerance for product \${item.productId}`);
             }
           }
        }
      }

      const processedItems = payload.items.map((item: any) => ({
        productId: item.productId,
        poItemId: item.poItemId,
        orderedQty: item.orderedQty,
        receivedQty: item.receivedQty,
        unitPrice: item.unitPrice,
        batchId: item.batchId || null
      }));

      const dataToSave = { ...payload, items: processedItems, createdById: actorUserId, status: GoodsReceiptNoteStatus.DRAFT };
      const grn = await grnRepository.create(organizationId, dataToSave, tx);

      await auditService.record({
        organizationId,
        userId: actorUserId,
        action: (AUDIT_ACTIONS as any).GRN_CREATED || "GRN_CREATED",
        entityType: AUDIT_ENTITY_TYPES.GRN,
        entityId: grn.id,
        metadata: { grnNumber: payload.grnNumber },
      }, tx);

      return grn;
    });
  },

  startInspection: async (id: string, organizationId: string, actorUserId: string) => {
    return prisma.$transaction(async (tx) => {
       const grn = await tx.goodsReceiptNote.findFirst({ where: { id, organizationId } });
       if (!grn) throw new ApiError(404, "GRN not found");
       if (grn.status !== GoodsReceiptNoteStatus.DRAFT) throw new ApiError(400, "Only DRAFT GRNs can start inspection");

       const updated = await tx.goodsReceiptNote.update({
         where: { id: grn.id },
         data: { status: "INSPECTION_RECORDED", inspectedById: actorUserId }
       });

       await auditService.record({
         organizationId, userId: actorUserId,
         action: "GRN_INSPECTION_STARTED" as any,
         entityType: AUDIT_ENTITY_TYPES.GRN,
         entityId: grn.id,
       }, tx);
       return updated;
    });
  },

  recordInspection: async (id: string, organizationId: string, actorUserId: string, itemsInspection: any[]) => {
     return prisma.$transaction(async (tx) => {
       const grn = await tx.goodsReceiptNote.findFirst({ where: { id, organizationId }, include: { items: true } });
       if (!grn) throw new ApiError(404, "GRN not found");
       if (grn.status !== GoodsReceiptNoteStatus.INSPECTING) throw new ApiError(400, "GRN must be in INSPECTING status");

       for (const inspectedItem of itemsInspection) {
         const grnItem = grn.items.find(i => i.id === inspectedItem.grnItemId);
         if (!grnItem) continue;

         if (Number(inspectedItem.acceptedQty) + Number(inspectedItem.rejectedQty) !== Number(grnItem.receivedQty)) {
            throw new ApiError(400, `Quantities for item ${grnItem.id} do not match received quantity.`);
         }

         await tx.goodsReceiptNoteItem.update({
            where: { id: grnItem.id },
            data: {
              acceptedQty: inspectedItem.acceptedQty,
              rejectedQty: inspectedItem.rejectedQty
            }
         });
       }

       const updated = await tx.goodsReceiptNote.update({
         where: { id },
         data: { 
           status: GoodsReceiptNoteStatus.RECEIVED,
           inspectedById: actorUserId
         }
       });

       await auditService.record({
         organizationId, userId: actorUserId,
         action: "GRN_INSPECTION_RECORDED" as any,
         entityType: AUDIT_ENTITY_TYPES.GRN,
         entityId: grn.id,
       }, tx);

       return updated;
     });
  },

  postGrn: async (id: string, organizationId: string, actorUserId: string) => {
    const result = await prisma.$transaction(async (tx) => {
      const grn = await tx.goodsReceiptNote.findFirst({
        where: { id, organizationId, deletedAt: null },
        include: { items: { include: { product: true } } },
      });

      if (!grn) throw new ApiError(404, "GRN not found");
      if (grn.status !== GoodsReceiptNoteStatus.RECEIVED && grn.status !== GoodsReceiptNoteStatus.DRAFT) {
        throw new ApiError(400, "GRN must be RECEIVED to be posted");
      }

      // If bypassing inspection, auto-accept all
      if (grn.status === GoodsReceiptNoteStatus.DRAFT) {
         for (const item of grn.items) {
           await tx.goodsReceiptNoteItem.update({
             where: { id: item.id },
             data: { acceptedQty: item.receivedQty }
           });
           item.acceptedQty = item.receivedQty;
         }
      }

      let totalAccepted = 0;
      let totalRejected = 0;
      let totalExpectedDeliveryTime = 0;
      let totalActualDeliveryTime = 0;
      let deliveryLines = 0;

      for (const item of grn.items) {
         const acceptedQty = Number(item.acceptedQty);
         const rejectedQty = Number(item.rejectedQty);
         if (acceptedQty === 0) continue;

         totalAccepted += acceptedQty;
         totalRejected += rejectedQty;

         const product = item.product;

         // Batch Tracking Logic
         let finalLotId = null;
         if (product.isBatchTracked) {
           if (!item.batchId) throw new ApiError(400, `Product ${product.name} requires a batch/lot number.`);
           // Create or find lot
           let lot = await tx.inventoryLot.findFirst({
              where: { lotNumber: item.batchId, productId: product.id, godownId: grn.godownId }
           });
           if (!lot) {
              lot = await tx.inventoryLot.create({
                 data: {
                   organizationId,
                   productId: product.id,
                   godownId: grn.godownId,
                   lotNumber: item.batchId,
                   receivedQuantity: acceptedQty,
                   availableQuantity: acceptedQty,
                   reservedQuantity: 0
                 }
              });
           } else {
               await tx.inventoryLot.update({
                 where: { id: lot.id },
                 data: {
                   receivedQuantity: { increment: acceptedQty },
                   availableQuantity: { increment: acceptedQty }
                 }
               });
           }
           finalLotId = lot.id;
         }

         // Create Inventory Movement -> this increments stock ledger
         await tx.inventoryMovement.create({
            data: {
              organizationId,
              productId: item.productId,
              godownId: grn.godownId,
              type: "GRN_RECEIPT",
              quantity: acceptedQty,
              referenceType: "GRN",
              referenceId: grn.id,
            },
         });

         // Update PO items received quantity if linked
         if (item.poItemId) {
           await tx.purchaseOrderItem.update({
             where: { id: item.poItemId },
             data: { receivedQuantity: { increment: acceptedQty } } // Only increment by accepted!
           });
         }
      }

      // Determine PO Status Update
      if (grn.purchaseOrderId) {
         const po = await tx.purchaseOrder.findFirst({
           where: { id: grn.purchaseOrderId },
           include: { items: true }
         });
         if (po) {
            let allFullyReceived = true;
             for (const poItem of po.items) {
               if (Number(poItem.receivedQuantity) < Number(poItem.quantity)) { // actually ordered qty is in quantity
                  allFullyReceived = false;
                  break;
               }
             }
            await tx.purchaseOrder.update({
               where: { id: po.id },
               data: { status: allFullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED" }
            });

            // For vendor performance lead time
            const expected = po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).getTime() : 0;
            const actual = new Date(grn.receivedDate).getTime();
            if (expected > 0) {
               const expectedDays = Math.ceil((expected - new Date(po.issueDate).getTime()) / (1000 * 3600 * 24));
               const actualDays = Math.ceil((actual - new Date(po.issueDate).getTime()) / (1000 * 3600 * 24));
               totalExpectedDeliveryTime += expectedDays;
               totalActualDeliveryTime += actualDays;
               deliveryLines++;
            }
         }
      }

      // Update Vendor Performance
      if (grn.vendorId) {
         const isLate = deliveryLines > 0 && totalActualDeliveryTime > totalExpectedDeliveryTime;
         await tx.vendorPerformance.upsert({
            where: { vendorId: grn.vendorId },
            update: {
               acceptedQuantity: { increment: totalAccepted },
               rejectedQuantity: { increment: totalRejected },
               lateDeliveries: isLate ? { increment: 1 } : undefined,
               onTimeDeliveries: !isLate ? { increment: 1 } : undefined,
               totalFulfilled: { increment: 1 }
            },
            create: {
               id: crypto.randomUUID(),
               vendorId: grn.vendorId,
               acceptedQuantity: totalAccepted,
               rejectedQuantity: totalRejected,
               lateDeliveries: isLate ? 1 : 0,
               onTimeDeliveries: !isLate ? 1 : 0,
               totalFulfilled: 1
            }
         });
      }

      const updatedGrn = await tx.goodsReceiptNote.update({
        where: { id: grn.id },
        data: { 
          status: GoodsReceiptNoteStatus.POSTED,
          postedById: actorUserId
        },
      });

      await (tx as any).outboxEvent.create({
        data: {
          organizationId,
          aggregateType: "GoodsReceiptNote",
          aggregateId: updatedGrn.id,
          eventType: "GoodsReceiptNoteReceived",
          payload: {
            grnId: updatedGrn.id,
            totalValue: updatedGrn.totalValue || 0,
            godownId: updatedGrn.godownId
          }
        }
      });

      await auditService.record({
        organizationId, userId: actorUserId,
        action: "GRN_POSTED" as any,
        entityType: AUDIT_ENTITY_TYPES.GRN,
        entityId: grn.id,
      }, tx);

      return updatedGrn;
    });

    import("../../../shared/events/event-bus.js").then(({ eventBus }) => {
      eventBus.emit("grn.posted", {
        organizationId,
        grnId: result.id,
        purchaseOrderId: result.purchaseOrderId
      });
    });

    return result;
  },

  getById: async (id: string, organizationId: string) => {
    const grn = await grnRepository.findById(id, organizationId);
    if (!grn) throw new ApiError(404, "GRN not found");
    return grn;
  },

  list: (organizationId: string, filters: GRNFilters, query: Record<string, unknown>) => {
    return grnRepository.list(organizationId, filters, query);
  },
};
