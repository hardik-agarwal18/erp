import prisma, { DatabaseTransactionClient } from "../../../config/database.js";
import { numberSeriesService } from "../../../infrastructure/number-series/number-series.service.js";

export const salesOrderService = {
  createDraftFromQuotationRevision: async (
    organizationId: string,
    revisionId: string,
    tx?: DatabaseTransactionClient
  ) => {
    const db = tx || prisma;
    
    // Find the revision and its quotation
    const revision = await db.quotationRevision.findUnique({
      where: { id: revisionId, quotation: { organizationId } },
      include: { lines: true, quotation: true }
    });

    if (!revision) throw new Error("Revision not found");

    const orderNumber = await numberSeriesService.generateNextNumber(
      organizationId,
      "SALES_ORDER",
      "SO"
    );

    const order = await db.salesOrder.create({
      data: {
        organizationId,
        customerId: revision.quotation.customerId,
        quotationRevisionId: revision.id,
        orderNumber,
        sourceType: "FROM_QUOTATION",
        status: "DRAFT",
        orderDate: new Date(),
        subtotal: revision.subtotal ?? 0,
        taxTotal: revision.taxTotal ?? 0,
        total: revision.total ?? 0,
        notes: `Auto-generated from Quotation ${revision.quotation.quotationNumber} (R${revision.revisionNumber})`,
        lines: {
          create: revision.lines.map(line => ({
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxRate: line.taxRate,
            total: line.total
          }))
        }
      }
    });

    // Track conversion
    await db.quotationRevision.update({
      where: { id: revision.id },
      data: { convertedSalesOrderId: order.id }
    });

    return order;
  },

  confirmOrder: async (
    organizationId: string,
    actorUserId: string,
    orderId: string
  ) => {
    return prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId, organizationId },
        include: { lines: true, customer: { include: { creditProfile: true } } }
      });

      if (!order) throw new Error("Sales order not found");
      if (order.status !== "DRAFT") throw new Error(`Cannot confirm order in status ${order.status}`);

      // 1. Credit Check Integration
      const { creditService } = await import("../../contacts/customers/credit.service.js");
      const { workflowService } = await import("../../../infrastructure/workflow/workflow.service.js");
      const { auditService } = await import("../../../services/audit/index.js");

      const exposureData = await creditService.calculateExposure(organizationId, order.customerId);
      const newTotalExposure = exposureData.totalExposure + Number(order.total);
      
      const creditLimit = Number(order.customer.creditProfile?.creditLimit ?? 0);
      
      let requiresApproval = false;
      if (creditLimit > 0 && newTotalExposure > creditLimit) {
        requiresApproval = true;
      }

      if (requiresApproval) {
        // Trigger workflow
        const workflowInstance = await workflowService.startWorkflow({
          organizationId,
          entityType: "SALES_ORDER", // Or a specific credit override type
          entityId: order.id,
          payload: {
            orderTotal: Number(order.total),
            currentExposure: exposureData.totalExposure,
            newExposure: newTotalExposure,
            creditLimit
          }
        });

        // If workflow is returned, it means approval is pending
        if (workflowInstance) {
          await tx.salesOrder.update({
            where: { id: order.id },
            data: { status: "PENDING_APPROVAL" }
          });

          await tx.customerCreditDecision.create({
            data: {
              organizationId,
              customerId: order.customerId,
              salesOrderId: order.id,
              exposureAtDecision: newTotalExposure,
              creditLimitAtDecision: creditLimit,
              decision: "PENDING",
              status: "PENDING",
              decisionReason: "Credit limit exceeded",
              workflowInstanceId: workflowInstance.id
            }
          });

          await auditService.record({
            organizationId,
            userId: actorUserId,
            action: "DOCUMENT_ADDED" as any,
            entityType: "sales_order" as any,
            entityId: order.id,
            metadata: { status: "PENDING_APPROVAL", workflowId: workflowInstance.id }
          }, tx);

          return { status: "PENDING_APPROVAL", workflowInstanceId: workflowInstance.id };
        }
      }

      // 2. If no approval needed, confirm directly
      await tx.salesOrder.update({
        where: { id: order.id },
        data: { status: "CONFIRMED", isLocked: true }
      });

      // Lock the credit decision
      await tx.customerCreditDecision.create({
        data: {
          organizationId,
          customerId: order.customerId,
          salesOrderId: order.id,
          exposureAtDecision: newTotalExposure,
          creditLimitAtDecision: creditLimit,
          decision: "APPROVED",
          status: "LOCKED",
          decisionReason: "Auto-approved within credit limits"
        }
      });

      // Trigger Inventory Reservations
      const { inventoryReservationService } = await import("../../inventory/inventory/inventory-reservation.service.js");
      await inventoryReservationService.reserveForSalesOrder(organizationId, order.id, tx);

      await auditService.record({
        organizationId,
        userId: actorUserId,
        action: "DOCUMENT_ADDED" as any,
        entityType: "sales_order" as any,
        entityId: order.id,
        metadata: { status: "CONFIRMED" }
      }, tx);

      return { status: "CONFIRMED" };
    });
  }
};
