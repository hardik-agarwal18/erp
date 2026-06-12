// @ts-nocheck
import ApiError from "../../../../utils/ApiError.js";
import { challanRepository } from "./delivery-challan.repository.js";
import { CreateDeliveryChallanInput, DeliveryChallanFilters } from "./delivery-challan.types.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../../services/audit/index.js";
import prisma from "../../../../config/database.js";

export const challanService = {
  create: async (organizationId: string, actorUserId: string, payload: CreateDeliveryChallanInput) => {
    const existing = await challanRepository.findByChallanNumber(payload.challanNumber, organizationId);
    if (existing) {
      throw new ApiError(400, "Challan with this number already exists");
    }

    const godown = await prisma.godown.findFirst({
      where: { id: payload.godownId, organizationId, deletedAt: null },
    });
    if (!godown) {
      throw new ApiError(404, "Godown not found");
    }

    const challan = await challanRepository.create(organizationId, payload);

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.CHALLAN_CREATED,
      entityType: AUDIT_ENTITY_TYPES.DELIVERY_CHALLAN,
      entityId: challan.id,
      metadata: { challanNumber: payload.challanNumber },
    });

    return challan;
  },

  dispatch: async (id: string, organizationId: string, actorUserId: string, payload?: any) => {
    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.deliveryChallan.findFirst({
        where: { id, organizationId, deletedAt: null },
        include: { items: true },
      });

      if (!challan) {
        throw new ApiError(404, "Delivery challan not found");
      }

      if (challan.status !== "DRAFT") {
        throw new ApiError(400, "Only DRAFT challans can be dispatched");
      }

      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new ApiError(404, "Product not found");

        if (product.isBatchTracked && !item.batchId) {
          throw new ApiError(400, `Product ${product.name} requires a batch number.`);
        }

        let serialNumberIds: string[] = [];
        if (product.isSerialTracked) {
          const payloadItem = payload?.items?.find((i: any) => i.challanItemId === item.id);
          serialNumberIds = payloadItem?.serialNumberIds || [];
          if (serialNumberIds.length !== Number(item.quantity)) {
            throw new ApiError(400, `Product ${product.name} requires exactly ${item.quantity} serial numbers selected.`);
          }
        }

        const inventoryItem = await tx.inventoryItem.findFirst({
          where: {
            organizationId,
            productId: item.productId,
            godownId: challan.godownId,
          },
        });

        if (!inventoryItem || Number(inventoryItem.quantity) < Number(item.quantity)) {
          throw new ApiError(400, `Insufficient stock for product ${item.productId}`);
        }

        if (item.batchId) {
          const batchInv = await tx.batchInventoryItem.findUnique({
            where: {
              batchId_godownId: {
                batchId: item.batchId,
                godownId: challan.godownId
              }
            }
          });
          
          if (!batchInv || Number(batchInv.quantity) < Number(item.quantity)) {
            throw new ApiError(400, `Insufficient stock for batch on product ${item.productId}`);
          }
          
          await tx.batchInventoryItem.update({
            where: { id: batchInv.id },
            data: { quantity: { decrement: item.quantity } }
          });
          
          // Decrement global batch quantity too
          await tx.batch.update({
            where: { id: item.batchId },
            data: { quantity: { decrement: item.quantity } }
          });
        }

        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        // Create inventory movement(s)
        if (product.isSerialTracked) {
          for (const snId of serialNumberIds) {
            const serialRecord = await tx.serialNumber.findUnique({ where: { id: snId } });
            if (!serialRecord || serialRecord.status !== "AVAILABLE" || serialRecord.godownId !== challan.godownId) {
              throw new ApiError(400, `Serial number ${serialRecord?.serialNumber || snId} is not available in the selected godown.`);
            }

            await tx.serialNumber.update({
              where: { id: snId },
              data: {
                status: "SOLD",
                soldDate: challan.deliveryDate,
              }
            });

            await tx.inventoryMovement.create({
              data: {
                organizationId,
                productId: item.productId,
                godownId: challan.godownId,
                type: "CHALLAN_ISSUE",
                quantity: -1,
                referenceType: "CHALLAN",
                referenceId: challan.id,
                batchId: item.batchId || null,
                serialNumberId: snId,
              },
            });
          }
        } else {
          await tx.inventoryMovement.create({
            data: {
              organizationId,
              productId: item.productId,
              godownId: challan.godownId,
              type: "CHALLAN_ISSUE",
              quantity: Number(item.quantity) * -1,
              referenceType: "CHALLAN",
              referenceId: challan.id,
              batchId: item.batchId || null,
            },
          });
        }
      }

      await tx.deliveryChallan.update({
        where: { id: challan.id },
        data: { status: "COMPLETED" },
      });

      await auditService.record({
        organizationId,
        userId: actorUserId,
        action: AUDIT_ACTIONS.CHALLAN_DISPATCHED,
        entityType: AUDIT_ENTITY_TYPES.DELIVERY_CHALLAN,
        entityId: challan.id,
      }, tx);

      return challan;
    });

    return result;
  },

  getById: async (id: string, organizationId: string) => {
    const challan = await challanRepository.findById(id, organizationId);
    if (!challan) {
      throw new ApiError(404, "Delivery challan not found");
    }
    return challan;
  },

  list: (organizationId: string, filters: DeliveryChallanFilters, query: Record<string, unknown>) => {
    return challanRepository.list(organizationId, filters, query);
  },
};
