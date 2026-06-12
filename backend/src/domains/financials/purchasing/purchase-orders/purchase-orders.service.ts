// @ts-nocheck
import { purchaseOrdersRepository } from "./purchase-orders.repository.js";
import { CreatePurchaseOrderInput } from "./purchase-orders.types.js";
import ApiError from "../../../../utils/ApiError.js";
import { PurchaseOrderStatus } from "@prisma/client";
import { approvalsService } from "../../../core/approvals/approvals.service.js";
import { eventBus } from "../../../../shared/events/event-bus.js";

// Initialize Event Listeners for Approval Workflow Engine
eventBus.on("approval.completed", async (event) => {
  if (event.entityType === "PURCHASE_ORDER") {
    console.log(`[EventBus] purchase-order ${event.entityId} approved`);
    await purchaseOrdersRepository.updateStatus(event.entityId, PurchaseOrderStatus.APPROVED);
    eventBus.emit("purchase-order.approved", { organizationId: event.organizationId, poId: event.entityId });
  }
});

eventBus.on("approval.rejected", async (event) => {
  if (event.entityType === "PURCHASE_ORDER") {
    console.log(`[EventBus] purchase-order ${event.entityId} rejected`);
    // Alternatively, revert back to DRAFT or create a new status like REJECTED
    await purchaseOrdersRepository.updateStatus(event.entityId, PurchaseOrderStatus.CANCELLED);
    eventBus.emit("purchase-order.cancelled", { organizationId: event.organizationId, poId: event.entityId });
  }
});

eventBus.on("grn.completed", async (event: any) => {
  if (!event.purchaseOrderId) return;
  const po = await purchaseOrdersRepository.getById(event.organizationId, event.purchaseOrderId);
  if (!po) return;

  // Check quantities
  let allReceived = true;
  let anyReceived = false;

  for (const item of po.items) {
    if (Number(item.receivedQuantity) > 0) anyReceived = true;
    if (Number(item.receivedQuantity) < Number(item.quantity)) {
      allReceived = false;
    }
  }

  let newStatus = po.status;
  if (allReceived) {
    newStatus = PurchaseOrderStatus.RECEIVED;
  } else if (anyReceived) {
    newStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED;
  }

  if (newStatus !== po.status) {
    await purchaseOrdersRepository.updateStatus(po.id, newStatus);
    console.log(`[EventBus] purchase-order ${po.id} status updated to ${newStatus}`);
  }
});

export const purchaseOrdersService = {
  create: async (organizationId: string, payload: CreatePurchaseOrderInput) => {
    // In a real system, we'd use a sequence generator here.
    const poNumber = `PO-${Date.now()}`;
    const po = await purchaseOrdersRepository.create(organizationId, poNumber, payload);
    
    eventBus.emit("purchase-order.created", { organizationId, poId: po.id });
    
    return po;
  },

  getById: async (organizationId: string, id: string) => {
    const po = await purchaseOrdersRepository.getById(organizationId, id);
    if (!po) throw new ApiError(404, "Purchase Order not found");
    return po;
  },

  list: async (organizationId: string) => {
    return purchaseOrdersRepository.list(organizationId);
  },

  submitForApproval: async (organizationId: string, id: string, userId: string) => {
    const po = await purchaseOrdersRepository.getById(organizationId, id);
    if (!po) throw new ApiError(404, "Purchase Order not found");
    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new ApiError(400, `Cannot submit PO in ${po.status} status.`);
    }

    // Call Approval Workflow Engine
    await approvalsService.submitForApproval(organizationId, "PURCHASE_ORDER", id, userId);

    // Update PO Status
    const updated = await purchaseOrdersRepository.updateStatus(id, PurchaseOrderStatus.PENDING_APPROVAL);
    return updated;
  },
};
