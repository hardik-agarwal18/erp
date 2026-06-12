
import prisma from "../../../config/database.js";
import ApiError from "../../../utils/ApiError.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../../services/audit/index.js";
import { inventoryRepository } from "./inventory.repository.js";
import {
  InventoryFilters,
  StockAdjustmentInput,
  StockTransferInput,
} from "./inventory.types.js";

const assertPhysicalProduct = async (
  organizationId: string,
  productId: string,
) => {
  const product = await inventoryRepository.findProductById(
    organizationId,
    productId,
  );
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  if (product.type !== "PHYSICAL") {
    throw new ApiError(
      400,
      "Inventory tracking is only available for physical products",
    );
  }
  return product;
};

export const inventoryService = {
  listItems: (
    organizationId: string,
    filters: InventoryFilters,
    query: Record<string, unknown>,
  ) => {
    return inventoryRepository.listItems(organizationId, filters, query);
  },
  listMovements: (
    organizationId: string,
    productId: string | undefined,
    query: Record<string, unknown>,
  ) => {
    return inventoryRepository.listMovements(organizationId, productId, query);
  },
  adjustStock: async (
    organizationId: string,
    actorUserId: string,
    payload: StockAdjustmentInput,
  ) => {
    await assertPhysicalProduct(organizationId, payload.productId);

    const result = await prisma.$transaction(async (tx) => {
      const product = await inventoryRepository.findProductById(
        organizationId,
        payload.productId,
        tx,
      );
      if (!product || product.type !== "PHYSICAL") {
        throw new ApiError(
          400,
          "Inventory tracking is only available for physical products",
        );
      }

      const existingItem = await inventoryRepository.findInventoryItemForUpdate(
        tx,
        organizationId,
        payload.productId,
        payload.godownId,
      );

      let item = existingItem;

      if (!item) {
        if (payload.quantity < 0) {
          throw new ApiError(400, "Insufficient stock for adjustment");
        }
        item = await inventoryRepository.createInventoryItem(
          tx,
          organizationId,
          payload.productId,
          payload.godownId,
          payload.quantity,
        );
      } else {
        if (Number(item.quantity) + payload.quantity < 0) {
          throw new ApiError(400, "Insufficient stock for adjustment");
        }
        await inventoryRepository.incrementInventoryItem(
          tx,
          organizationId,
          item.id,
          payload.quantity,
        );
        item = await inventoryRepository.findInventoryItemForUpdate(
          tx,
          organizationId,
          payload.productId,
          payload.godownId,
        );
      }

      if (!item) {
        throw new ApiError(500, "Unable to update inventory");
      }

      const movement = await inventoryRepository.createInventoryMovement(
        tx,
        organizationId,
        {
          productId: payload.productId,
          godownId: payload.godownId,
          type: "ADJUSTMENT",
          quantity: payload.quantity,
          referenceId: payload.referenceId,
        },
      );

      await inventoryRepository.createFinancialTransaction(
        tx,
        organizationId,
        {
          type: payload.quantity >= 0 ? "PURCHASE" : "SALE",
          referenceType: "inventory.adjustment",
          referenceId: movement.id,
          amount: Math.abs(payload.quantity),
          description: "Inventory adjustment",
        },
      );

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.INVENTORY_ADJUSTED,
          entityType: AUDIT_ENTITY_TYPES.INVENTORY_ITEM,
          entityId: item.id,
          metadata: {
            productId: payload.productId,
            quantity: payload.quantity,
          },
        },
        tx,
      );

      return { item, movement };
    });

    return result;
  },
  transferStock: async (
    organizationId: string,
    actorUserId: string,
    payload: StockTransferInput,
  ) => {
    await assertPhysicalProduct(organizationId, payload.productId);

    const result = await prisma.$transaction(async (tx) => {
      const product = await inventoryRepository.findProductById(
        organizationId,
        payload.productId,
        tx,
      );
      if (!product || product.type !== "PHYSICAL") {
        throw new ApiError(
          400,
          "Inventory tracking is only available for physical products",
        );
      }

      const item = await inventoryRepository.findInventoryItemForUpdate(
        tx,
        organizationId,
        payload.productId,
        payload.fromGodownId,
      );

      if (!item || Number(item.quantity) < payload.quantity) {
        throw new ApiError(400, "Insufficient stock for transfer");
      }

      await inventoryRepository.decrementInventoryItem(
        tx,
        organizationId,
        item.id,
        payload.quantity,
      );

      const updatedItem = await inventoryRepository.findInventoryItemForUpdate(
        tx,
        organizationId,
        payload.productId,
        payload.fromGodownId,
      );
      if (!updatedItem) {
        throw new ApiError(500, "Unable to update inventory");
      }

      const movement = await inventoryRepository.createInventoryMovement(
        tx,
        organizationId,
        {
          productId: payload.productId,
          godownId: payload.fromGodownId,
          type: "TRANSFER",
          quantity: payload.quantity,
          referenceId: payload.referenceId,
        },
      );

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.INVENTORY_TRANSFERRED,
          entityType: AUDIT_ENTITY_TYPES.INVENTORY_ITEM,
          entityId: updatedItem.id,
          metadata: {
            productId: payload.productId,
            quantity: payload.quantity,
          },
        },
        tx,
      );

      return { item: updatedItem, movement };
    });

    return result;
  },
};
