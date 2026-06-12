
import ApiError from "../../../utils/ApiError.js";
import { verificationRepository } from "./stock-verification.repository.js";
import { CreateStockVerificationInput, CompleteStockVerificationInput, StockVerificationFilters } from "./stock-verification.types.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../../services/audit/index.js";
import prisma from "../../../config/database.js";

export const verificationService = {
  create: async (organizationId: string, actorUserId: string, payload: CreateStockVerificationInput) => {
    const existing = await verificationRepository.findByVerificationNumber(payload.verificationNumber, organizationId);
    if (existing) {
      throw new ApiError(400, "Verification with this number already exists");
    }

    const godown = await prisma.godown.findFirst({
      where: { id: payload.godownId, organizationId, deletedAt: null },
    });
    if (!godown) {
      throw new ApiError(404, "Godown not found");
    }

    const verification = await verificationRepository.create(organizationId, payload);

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: "VERIFICATION_CREATED" as any,
      entityType: "STOCK_VERIFICATION" as any,
      entityId: verification.id,
      metadata: { verificationNumber: payload.verificationNumber },
    });

    return verification;
  },

  complete: async (id: string, organizationId: string, actorUserId: string, payload: CompleteStockVerificationInput) => {
    const result = await prisma.$transaction(async (tx: any) => {
      const verification = await tx.stockVerification.findFirst({
        where: { id, organizationId, deletedAt: null },
        include: { items: true },
      });

      if (!verification) {
        throw new ApiError(404, "Stock verification not found");
      }

      if (verification.status === "COMPLETED") {
        throw new ApiError(400, "Verification is already completed");
      }

      for (const inputItem of payload.items) {
        const item = verification.items.find((i: any) => i.id === inputItem.id);
        if (!item) {
          throw new ApiError(400, `Item ${inputItem.id} not found in this verification`);
        }

        const varianceQty = inputItem.physicalQty - Number(item.expectedQty);
        
        const product = await tx.product.findUnique({ where: { id: item.productId } });

        await tx.stockVerificationItem.update({
          where: { id: item.id },
          data: {
            physicalQty: inputItem.physicalQty,
            varianceQty,
          },
        });

        if (varianceQty !== 0) {
          // Create adjustment automatically for variance
          let inventoryItem = await tx.inventoryItem.findFirst({
            where: {
              organizationId,
              productId: item.productId,
              godownId: verification.godownId,
            },
          });

          if (!inventoryItem && varianceQty > 0) {
            inventoryItem = await tx.inventoryItem.create({
              data: {
                organizationId,
                productId: item.productId,
                godownId: verification.godownId,
                quantity: varianceQty,
              },
            });
            } else if (inventoryItem) {
              await tx.inventoryItem.update({
                where: { id: inventoryItem.id },
                data: {
                  quantity: { increment: varianceQty },
                },
              });
            }

            if (item.batchId) {
              let batchInv = await tx.batchInventoryItem.findUnique({
                where: {
                  batchId_godownId: {
                    batchId: item.batchId,
                    godownId: verification.godownId
                  }
                }
              });

              if (!batchInv && varianceQty > 0) {
                await tx.batchInventoryItem.create({
                  data: {
                    organizationId,
                    batchId: item.batchId,
                    godownId: verification.godownId,
                    quantity: varianceQty
                  }
                });
                await tx.batch.update({
                  where: { id: item.batchId },
                  data: { quantity: { increment: varianceQty } }
                });
              } else if (batchInv) {
                await tx.batchInventoryItem.update({
                  where: { id: batchInv.id },
                  data: { quantity: { increment: varianceQty } }
                });
                await tx.batch.update({
                  where: { id: item.batchId },
                  data: { quantity: { increment: varianceQty } }
                });
              }
            }

          if (!product?.isSerialTracked && (inventoryItem || varianceQty > 0)) {
            await tx.inventoryMovement.create({
              data: {
                organizationId,
                productId: item.productId,
                godownId: verification.godownId,
                type: "ADJUSTMENT",
                quantity: varianceQty,
                referenceType: "ADJUSTMENT",
                referenceId: verification.id,
                batchId: item.batchId || null,
              },
            });
          }
          
          if (product?.isSerialTracked) {
            const missingSerialIds = inputItem.missingSerialIds || [];
            for (const snId of missingSerialIds) {
              await tx.serialNumber.update({
                where: { id: snId },
                data: { status: "MISSING" }
              });
              await tx.inventoryMovement.create({
                data: {
                  organizationId,
                  productId: item.productId,
                  godownId: verification.godownId,
                  type: "ADJUSTMENT",
                  quantity: -1,
                  referenceType: "ADJUSTMENT",
                  referenceId: verification.id,
                  batchId: item.batchId || null,
                  serialNumberId: snId,
                },
              });
            }

            const foundSerialNumbers = inputItem.foundSerialNumbers || [];
            for (const sn of foundSerialNumbers) {
              let serialRecord = await tx.serialNumber.findUnique({
                where: { organizationId_serialNumber: { organizationId, serialNumber: sn } }
              });

              if (serialRecord) {
                await tx.serialNumber.update({
                  where: { id: serialRecord.id },
                  data: { godownId: verification.godownId, status: "AVAILABLE" }
                });
              } else {
                serialRecord = await tx.serialNumber.create({
                  data: {
                    organizationId,
                    productId: item.productId,
                    godownId: verification.godownId,
                    serialNumber: sn,
                    status: "AVAILABLE",
                    batchId: item.batchId || null,
                    purchaseDate: new Date(),
                  }
                });
              }

              await tx.inventoryMovement.create({
                data: {
                  organizationId,
                  productId: item.productId,
                  godownId: verification.godownId,
                  type: "ADJUSTMENT",
                  quantity: 1,
                  referenceType: "ADJUSTMENT",
                  referenceId: verification.id,
                  batchId: item.batchId || null,
                  serialNumberId: serialRecord.id,
                },
              });
            }
          }
        }
      }

      await tx.stockVerification.update({
        where: { id: verification.id },
        data: { 
          status: "COMPLETED",
          completedDate: new Date(),
        },
      });

      await auditService.record({
        organizationId,
        userId: actorUserId,
        action: "VERIFICATION_COMPLETED" as any,
        entityType: "STOCK_VERIFICATION" as any,
        entityId: verification.id,
      }, tx);

      return tx.stockVerification.findFirst({
        where: { id: verification.id },
        include: { items: true },
      });
    });

    return result;
  },

  getById: async (id: string, organizationId: string) => {
    const verification = await verificationRepository.findById(id, organizationId);
    if (!verification) {
      throw new ApiError(404, "Stock verification not found");
    }
    return verification;
  },

  list: (organizationId: string, filters: StockVerificationFilters, query: Record<string, unknown>) => {
    return verificationRepository.list(organizationId, filters, query);
  },
};
