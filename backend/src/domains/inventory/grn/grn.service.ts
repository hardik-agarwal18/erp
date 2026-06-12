
import ApiError from "../../../utils/ApiError.js";
import { grnRepository } from "./grn.repository.js";
import { GRNFilters } from "./grn.types.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../../services/audit/index.js";
import prisma from "../../../config/database.js";

export const grnService = {
  create: async (organizationId: string, actorUserId: string, payload: any) => {
    return prisma.$transaction(async (tx: any) => {
      const existing = await tx.goodsReceiptNote.findFirst({
        where: { grnNumber: payload.grnNumber, organizationId, deletedAt: null }
      });
      if (existing) {
        throw new ApiError(400, "GRN with this number already exists");
      }

      const godown = await tx.godown.findFirst({
        where: { id: payload.godownId, organizationId, deletedAt: null },
      });
      if (!godown) {
        throw new ApiError(404, "Godown not found");
      }

      if (payload.purchaseOrderId) {
        const po = await tx.purchaseOrder.findFirst({
          where: { id: payload.purchaseOrderId, organizationId }
        });
        if (!po) throw new ApiError(404, "Purchase Order not found");
        if (po.status !== "APPROVED" && po.status !== "PARTIALLY_RECEIVED") {
          throw new ApiError(400, `Cannot create GRN for PO in ${po.status} status.`);
        }
      }

      const processedItems = [];
      for (const item of payload.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        let finalBatchId = item.batchId;

        if (product?.isBatchTracked) {
          if (item.batchMode === "CREATE_NEW") {
            if (!item.batchNumber) throw new ApiError(400, "Batch Number Required");
            if (!item.expiryDate) throw new ApiError(400, "Expiry Date Required");
            
            const newBatch = await tx.batch.create({
              data: {
                organizationId,
                productId: item.productId,
                batchNumber: item.batchNumber,
                manufactureDate: item.manufactureDate ? new Date(item.manufactureDate) : null,
                expiryDate: new Date(item.expiryDate),
                quantity: 0
              }
            });
            finalBatchId = newBatch.id;
          } else if (!item.batchId) {
             throw new ApiError(400, "Batch ID Required");
          }
        }

        processedItems.push({
          productId: item.productId,
          poItemId: item.poItemId,
          orderedQty: item.orderedQty,
          receivedQty: item.receivedQty,
          unitPrice: item.unitPrice,
          batchId: finalBatchId
        });
      }

      const dataToSave = { ...payload, items: processedItems };
      const grn = await grnRepository.create(organizationId, dataToSave, tx);

      await auditService.record({
        organizationId,
        userId: actorUserId,
        action: (AUDIT_ACTIONS as any).GRN_CREATED,
        entityType: AUDIT_ENTITY_TYPES.GRN,
        entityId: grn.id,
        metadata: { grnNumber: payload.grnNumber },
      }, tx);

      return grn;
    });
  },

  receive: async (id: string, organizationId: string, actorUserId: string, payload?: any) => {
    const result = await prisma.$transaction(async (tx) => {
      const grn = await tx.goodsReceiptNote.findFirst({
        where: { id, organizationId, deletedAt: null },
        include: { items: true },
      });

      if (!grn) {
        throw new ApiError(404, "GRN not found");
      }

      if (grn.status !== "DRAFT") {
        throw new ApiError(400, "Only DRAFT GRN can be received");
      }

      for (const item of grn.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new ApiError(404, "Product not found");

        if (product.isBatchTracked && !item.batchId) {
          throw new ApiError(400, `Product ${product.name} requires a batch number.`);
        }

        let serialNumbers: string[] = [];
        if (product.isSerialTracked) {
          const payloadItem = payload?.items?.find((i: any) => i.grnItemId === item.id);
          serialNumbers = payloadItem?.serialNumbers || [];
          if (serialNumbers.length !== Number(item.receivedQty)) {
            throw new ApiError(400, `Product ${product.name} requires exactly ${item.receivedQty} serial numbers.`);
          }
        }

        let inventoryItem = await tx.inventoryItem.findFirst({
          where: {
            organizationId,
            productId: item.productId,
            godownId: grn.godownId,
          },
        });

        if (!inventoryItem) {
          inventoryItem = await tx.inventoryItem.create({
            data: {
              organizationId,
              productId: item.productId,
              godownId: grn.godownId,
              quantity: item.receivedQty,
              averageCost: item.unitPrice,
            },
          });
        } else {
          // Calculate new average cost
          const currentQty = Number(inventoryItem.quantity);
          const currentCost = Number(inventoryItem.averageCost);
          const receivedQty = Number(item.receivedQty);
          const receivedCost = Number(item.unitPrice);
          const newQty = currentQty + receivedQty;
          
          let newAvgCost = currentCost;
          if (newQty > 0) {
             newAvgCost = ((currentQty * currentCost) + (receivedQty * receivedCost)) / newQty;
          }

          await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: {
              quantity: { increment: item.receivedQty },
              averageCost: newAvgCost,
            },
          });
        }

        if (item.batchId) {
          // Increment Batch quantity globally
          await tx.batch.update({
            where: { id: item.batchId },
            data: { quantity: { increment: item.receivedQty } }
          });

          // Update BatchInventoryItem
          let batchInv = await tx.batchInventoryItem.findUnique({
            where: {
              batchId_godownId: {
                batchId: item.batchId,
                godownId: grn.godownId
              }
            }
          });
          if (!batchInv) {
            await tx.batchInventoryItem.create({
              data: {
                organizationId,
                batchId: item.batchId,
                godownId: grn.godownId,
                quantity: item.receivedQty
              }
            });
          } else {
            await tx.batchInventoryItem.update({
              where: { id: batchInv.id },
              data: { quantity: { increment: item.receivedQty } }
            });
          }
        }

        // Create inventory movement(s)
        if (product.isSerialTracked) {
          for (const sn of serialNumbers) {
            const serialRecord = await tx.serialNumber.create({
              data: {
                organizationId,
                productId: item.productId,
                godownId: grn.godownId,
                serialNumber: sn,
                status: "AVAILABLE",
                batchId: item.batchId || null,
                purchaseDate: grn.receivedDate,
              }
            });

            await tx.inventoryMovement.create({
              data: {
                organizationId,
                productId: item.productId,
                godownId: grn.godownId,
                type: "GRN_RECEIPT",
                quantity: 1,
                referenceType: "GRN",
                referenceId: grn.id,
                batchId: item.batchId || null,
                serialNumberId: serialRecord.id,
              },
            });
          }
        } else {
          await tx.inventoryMovement.create({
            data: {
              organizationId,
              productId: item.productId,
              godownId: grn.godownId,
              type: "GRN_RECEIPT",
              quantity: item.receivedQty,
              referenceType: "GRN",
              referenceId: grn.id,
              batchId: item.batchId || null,
            },
          });
        }
      }

      // Update PO items received quantity if linked
      if (grn.purchaseOrderId) {
        for (const item of grn.items) {
          if (item.poItemId) {
            await tx.purchaseOrderItem.update({
              where: { id: item.poItemId },
              data: { receivedQuantity: { increment: item.receivedQty } }
            });
          }
        }
        
        // Let event listener update the overall PO status to PARTIALLY_RECEIVED or RECEIVED
      }

      await tx.goodsReceiptNote.update({
        where: { id: grn.id },
        data: { status: "COMPLETED" },
      });

      await auditService.record({
        organizationId,
        userId: actorUserId,
        action: (AUDIT_ACTIONS as any).GRN_RECEIVED,
        entityType: AUDIT_ENTITY_TYPES.GRN,
        entityId: grn.id,
      }, tx);

      return grn;
    });

    // Emit Event
    import("../../../shared/events/event-bus.js").then(({ eventBus }) => {
      eventBus.emit("grn.completed", {
        organizationId,
        grnId: result.id,
        purchaseOrderId: result.purchaseOrderId
      });
    });

    return result;
  },

  getById: async (id: string, organizationId: string) => {
    const grn = await grnRepository.findById(id, organizationId);
    if (!grn) {
      throw new ApiError(404, "GRN not found");
    }
    return grn;
  },

  list: (organizationId: string, filters: GRNFilters, query: Record<string, unknown>) => {
    return grnRepository.list(organizationId, filters, query);
  },
};
