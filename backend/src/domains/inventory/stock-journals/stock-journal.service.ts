
import ApiError from "../../../utils/ApiError.js";
import { journalRepository } from "./stock-journal.repository.js";
import { CreateStockJournalInput, StockJournalFilters } from "./stock-journal.types.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../../services/audit/index.js";
import prisma from "../../../config/database.js";

export const journalService = {
  create: async (organizationId: string, actorUserId: string, payload: CreateStockJournalInput) => {
    const existing = await journalRepository.findByJournalNumber(payload.journalNumber, organizationId);
    if (existing) {
      throw new ApiError(400, "Journal with this number already exists");
    }

    const fromGodown = await prisma.godown.findFirst({
      where: { id: payload.fromGodownId, organizationId, deletedAt: null },
    });
    if (!fromGodown) {
      throw new ApiError(404, "Source godown not found");
    }

    const toGodown = await prisma.godown.findFirst({
      where: { id: payload.toGodownId, organizationId, deletedAt: null },
    });
    if (!toGodown) {
      throw new ApiError(404, "Destination godown not found");
    }

    const journal = await journalRepository.create(organizationId, payload);

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: "JOURNAL_CREATED" as any,
      entityType: "STOCK_JOURNAL" as any,
      entityId: journal.id,
      metadata: { journalNumber: payload.journalNumber },
    });

    return journal;
  },

  post: async (id: string, organizationId: string, actorUserId: string, payload?: any) => {
    const result = await prisma.$transaction(async (tx: any) => {
      const journal = await tx.stockJournal.findFirst({
        where: { id, organizationId, deletedAt: null },
        include: { items: true },
      });

      if (!journal) {
        throw new ApiError(404, "Stock journal not found");
      }

      if (journal.status !== "DRAFT") {
        throw new ApiError(400, "Only DRAFT journals can be posted");
      }

      for (const item of journal.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new ApiError(404, "Product not found");

        if (product.isBatchTracked && !item.batchId) {
          throw new ApiError(400, `Product ${product.name} requires a batch number.`);
        }

        let serialNumberIds: string[] = [];
        if (product.isSerialTracked) {
          const payloadItem = payload?.items?.find((i: any) => i.journalItemId === item.id);
          serialNumberIds = payloadItem?.serialNumberIds || [];
          if (serialNumberIds.length !== Number(item.quantity)) {
            throw new ApiError(400, `Product ${product.name} requires exactly ${item.quantity} serial numbers selected.`);
          }
        }

        // Source godown stock check and deduction
        const sourceInventory = await tx.inventoryItem.findFirst({
          where: {
            organizationId,
            productId: item.productId,
            godownId: journal.fromGodownId,
          },
        });

        if (!sourceInventory || Number(sourceInventory.quantity) < Number(item.quantity)) {
          throw new ApiError(400, `Insufficient stock for product ${item.productId} in source godown`);
        }

        if (item.batchId) {
          const sourceBatchInv = await tx.batchInventoryItem.findUnique({
            where: {
              batchId_godownId: {
                batchId: item.batchId,
                godownId: journal.fromGodownId
              }
            }
          });
          
          if (!sourceBatchInv || Number(sourceBatchInv.quantity) < Number(item.quantity)) {
            throw new ApiError(400, `Insufficient stock for batch on product ${item.productId} in source godown`);
          }
          
          await tx.batchInventoryItem.update({
            where: { id: sourceBatchInv.id },
            data: { quantity: { decrement: item.quantity } }
          });
        }

        await tx.inventoryItem.update({
          where: { id: sourceInventory.id },
          data: {
            quantity: { decrement: item.quantity },
          },
        });



        // Destination godown stock increment
        let destInventory = await tx.inventoryItem.findFirst({
          where: {
            organizationId,
            productId: item.productId,
            godownId: journal.toGodownId,
          },
        });

        if (!destInventory) {
          destInventory = await tx.inventoryItem.create({
            data: {
              organizationId,
              productId: item.productId,
              godownId: journal.toGodownId,
              quantity: item.quantity,
              averageCost: sourceInventory.averageCost,
            },
          });
        } else {
          await tx.inventoryItem.update({
            where: { id: destInventory.id },
            data: {
              quantity: { increment: item.quantity },
            },
          });
        }

        if (item.batchId) {
          const destBatchInv = await tx.batchInventoryItem.findUnique({
            where: {
              batchId_godownId: {
                batchId: item.batchId,
                godownId: journal.toGodownId
              }
            }
          });
          
          if (!destBatchInv) {
            await tx.batchInventoryItem.create({
              data: {
                organizationId,
                batchId: item.batchId,
                godownId: journal.toGodownId,
                quantity: item.quantity
              }
            });
          } else {
            await tx.batchInventoryItem.update({
              where: { id: destBatchInv.id },
              data: { quantity: { increment: item.quantity } }
            });
          }
        }

        if (product.isSerialTracked) {
          for (const snId of serialNumberIds) {
            const serialRecord = await tx.serialNumber.findUnique({ where: { id: snId } });
            if (!serialRecord || serialRecord.status !== "AVAILABLE" || serialRecord.godownId !== journal.fromGodownId) {
              throw new ApiError(400, `Serial number ${serialRecord?.serialNumber || snId} is not available in the source godown.`);
            }

            // Transfer serial to new godown
            await tx.serialNumber.update({
              where: { id: snId },
              data: {
                godownId: journal.toGodownId,
              }
            });

            await tx.inventoryMovement.create({
              data: {
                organizationId,
                productId: item.productId,
                godownId: journal.fromGodownId,
                type: "JOURNAL",
                quantity: -1,
                referenceType: "JOURNAL",
                referenceId: journal.id,
                batchId: item.batchId || null,
                serialNumberId: snId,
              },
            });

            await tx.inventoryMovement.create({
              data: {
                organizationId,
                productId: item.productId,
                godownId: journal.toGodownId,
                type: "JOURNAL",
                quantity: 1,
                referenceType: "JOURNAL",
                referenceId: journal.id,
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
              godownId: journal.fromGodownId,
              type: "JOURNAL",
              quantity: Number(item.quantity) * -1,
              referenceType: "JOURNAL",
              referenceId: journal.id,
              batchId: item.batchId || null,
            },
          });
          
          await tx.inventoryMovement.create({
            data: {
              organizationId,
              productId: item.productId,
              godownId: journal.toGodownId,
              type: "JOURNAL",
              quantity: item.quantity,
              referenceType: "JOURNAL",
              referenceId: journal.id,
              batchId: item.batchId || null,
            },
          });
        }
      }

      await tx.stockJournal.update({
        where: { id: journal.id },
        data: { status: "COMPLETED" },
      });

      await auditService.record({
        organizationId,
        userId: actorUserId,
        action: "JOURNAL_POSTED" as any,
        entityType: "STOCK_JOURNAL" as any,
        entityId: journal.id,
      }, tx);

      return journal;
    });

    return result;
  },

  getById: async (id: string, organizationId: string) => {
    const journal = await journalRepository.findById(id, organizationId);
    if (!journal) {
      throw new ApiError(404, "Stock journal not found");
    }
    return journal;
  },

  list: (organizationId: string, filters: StockJournalFilters, query: Record<string, unknown>) => {
    return journalRepository.list(organizationId, filters, query);
  },
};
