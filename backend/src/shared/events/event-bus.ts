// @ts-nocheck
import { EventEmitter } from "events";

export const eventBus = new EventEmitter();

// Increase max listeners if needed later
// eventBus.setMaxListeners(20);

// We can define standard event payloads here if desired
export interface ApprovalCompletedEvent {
  organizationId: string;
  entityType: string;
  entityId: string;
  approvalInstanceId: string;
  approvedBy: string;
  approvedAt: Date;
}

export interface ApprovalRejectedEvent {
  organizationId: string;
  entityType: string;
  entityId: string;
  approvalInstanceId: string;
  rejectedBy: string;
  rejectedAt: Date;
}

// Strong typing helper
export function emitApprovalCompleted(payload: ApprovalCompletedEvent) {
  eventBus.emit("approval.completed", payload);
}

export function emitApprovalRejected(payload: ApprovalRejectedEvent) {
  eventBus.emit("approval.rejected", payload);
}

// --- Caching Invalidation Events ---

export interface EntityUpdatedEvent {
  organizationId: string;
  entityId: string;
}

// Emitting events
export function emitProductUpdated(payload: EntityUpdatedEvent) {
  eventBus.emit("product.updated", payload);
}

export function emitInventoryAdjusted(payload: EntityUpdatedEvent) {
  eventBus.emit("inventory.adjusted", payload);
}

export function emitPurchaseOrderApproved(payload: EntityUpdatedEvent) {
  eventBus.emit("purchase-order.approved", payload);
}

export function emitVendorInvoicePosted(payload: EntityUpdatedEvent) {
  eventBus.emit("vendor-invoice.posted", payload);
}

export function emitEmployeeUpdated(payload: EntityUpdatedEvent) {
  eventBus.emit("employee.updated", payload);
}

export function emitCustomerUpdated(payload: EntityUpdatedEvent) {
  eventBus.emit("customer.updated", payload);
}

export function emitVendorUpdated(payload: EntityUpdatedEvent) {
  eventBus.emit("vendor.updated", payload);
}

export function emitRoleUpdated(payload: EntityUpdatedEvent) {
  eventBus.emit("role.updated", payload);
}

export function emitOrganizationUpdated(payload: EntityUpdatedEvent) {
  eventBus.emit("organization.updated", payload);
}

// To avoid circular dependency issues, we do a late require/import for CacheService if needed,
// but since this is just adding listeners, we can import at the top.
import { CacheService, CACHE_DOMAINS } from "../cache/index.js";

// Hook up cache invalidation listeners
eventBus.on("product.updated", (payload: EntityUpdatedEvent) => {
  CacheService.deletePattern({
    organizationId: payload.organizationId,
    domain: CACHE_DOMAINS.PRODUCTS,
  });
});

eventBus.on("inventory.adjusted", (payload: EntityUpdatedEvent) => {
  CacheService.deletePattern({
    organizationId: payload.organizationId,
    domain: CACHE_DOMAINS.INVENTORY,
  });
  CacheService.deletePattern({
    organizationId: payload.organizationId,
    domain: CACHE_DOMAINS.DASHBOARD,
  });
});

eventBus.on("purchase-order.approved", (payload: EntityUpdatedEvent) => {
  CacheService.deletePattern({
    organizationId: payload.organizationId,
    domain: CACHE_DOMAINS.DASHBOARD,
  });
});

eventBus.on("vendor-invoice.posted", (payload: EntityUpdatedEvent) => {
  CacheService.deletePattern({
    organizationId: payload.organizationId,
    domain: CACHE_DOMAINS.ACCOUNTING_REPORTS,
  });
  CacheService.deletePattern({
    organizationId: payload.organizationId,
    domain: CACHE_DOMAINS.DASHBOARD,
  });
});

eventBus.on("employee.updated", (payload: EntityUpdatedEvent) => {
  // Typically might invalidate HRMS cache, but we don't have a specific domain listed,
  // we could invalidate roles/permissions or just general organization cache
  CacheService.deletePattern({
    organizationId: payload.organizationId,
    domain: CACHE_DOMAINS.ROLES,
  });
});

eventBus.on("customer.updated", (payload: EntityUpdatedEvent) => {
  CacheService.deletePattern({
    organizationId: payload.organizationId,
    domain: CACHE_DOMAINS.CUSTOMERS,
  });
});

eventBus.on("vendor.updated", (payload: EntityUpdatedEvent) => {
  CacheService.deletePattern({
    organizationId: payload.organizationId,
    domain: CACHE_DOMAINS.VENDORS,
  });
});

eventBus.on("role.updated", (payload: EntityUpdatedEvent) => {
  CacheService.deletePattern({
    organizationId: payload.organizationId,
    domain: CACHE_DOMAINS.ROLES,
  });
});

eventBus.on("organization.updated", (payload: EntityUpdatedEvent) => {
  CacheService.deletePattern({
    organizationId: payload.organizationId,
    domain: CACHE_DOMAINS.ORGANIZATIONS,
  });
});
