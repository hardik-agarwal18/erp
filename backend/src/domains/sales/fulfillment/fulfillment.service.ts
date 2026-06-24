import prisma, { DatabaseTransactionClient } from "../../../config/database.js";
import { numberSeriesService } from "../../../infrastructure/number-series/number-series.service.js";
import { auditService } from "../../../services/audit/index.js";

export const fulfillmentService = {
  createDeliveryChallan: async (
    organizationId: string,
    actorUserId: string,
    salesOrderId: string,
    tx?: DatabaseTransactionClient
  ) => {
    const db = tx || prisma;
    
    const order = await db.salesOrder.findUnique({
      where: { id: salesOrderId, organizationId },
      include: { lines: true }
    });

    if (!order) throw new Error("Order not found");
    if (order.status !== "CONFIRMED" && order.status !== "PARTIALLY_FULFILLED") {
      throw new Error("Order must be confirmed to start fulfillment");
    }

    const challanNumber = await numberSeriesService.generateNextNumber(
      organizationId,
      "DELIVERY_CHALLAN",
      "DC"
    );

    const challan = await db.deliveryChallan.create({
      data: {
        organizationId,
        customerId: order.customerId,
        salesOrderId: order.id,
        challanNumber,
        status: "DRAFT",
        deliveryDate: new Date(),
        items: {
          create: order.lines.map(line => ({
            productId: line.productId,
            quantity: Number(line.quantity) - Number(line.fulfilledQuantity || 0)
          }))
        }
      }
    });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: "DOCUMENT_ADDED" as any,
      entityType: "delivery_challan" as any,
      entityId: challan.id,
      metadata: { challanNumber }
    }, db);

    return challan;
  },

  createPickList: async (
    organizationId: string,
    actorUserId: string,
    deliveryChallanId: string,
    allocations: { productId: string; godownId: string; quantity: number }[],
    tx?: DatabaseTransactionClient
  ) => {
    const db = tx || prisma;

    const challan = await db.deliveryChallan.findUnique({
      where: { id: deliveryChallanId, organizationId }
    });
    if (!challan) throw new Error("Challan not found");

    const listNumber = await numberSeriesService.generateNextNumber(
      organizationId,
      "PICK_LIST",
      "PL"
    );

    const pickList = await db.pickList.create({
      data: {
        organizationId,
        deliveryChallanId: challan.id,
        listNumber,
        status: "DRAFT",
        items: {
          create: allocations.map(a => ({
            productId: a.productId,
            godownId: a.godownId,
            quantityToPick: a.quantity
          }))
        }
      }
    });

    await db.deliveryChallan.update({
      where: { id: challan.id },
      data: { status: "PICKING" }
    });

    return pickList;
  },

  dispatchChallan: async (
    organizationId: string,
    actorUserId: string,
    deliveryChallanId: string,
    carrierId?: string,
    trackingNumber?: string,
    tx?: DatabaseTransactionClient
  ) => {
    const db = tx || prisma;
    const challan = await db.deliveryChallan.findUnique({
      where: { id: deliveryChallanId, organizationId },
      include: { items: true, salesOrder: true }
    });

    if (!challan) throw new Error("Challan not found");
    if (challan.status !== "PACKED") throw new Error("Challan must be packed before dispatch");

    const shipmentNumber = await numberSeriesService.generateNextNumber(organizationId, "SHIPMENT", "SHP");

    const shipment = await db.shipment.create({
      data: {
        organizationId,
        deliveryChallanId: challan.id,
        shipmentNumber,
        carrierId,
        trackingNumber,
        dispatchedAt: new Date()
      }
    });

    await db.deliveryChallan.update({
      where: { id: challan.id },
      data: { status: "DISPATCHED", dispatchDate: new Date() }
    });

    // Reduce inventory and consume reservations
    const { inventoryRepository } = await import("../../inventory/inventory/inventory.repository.js");
    
    for (const item of challan.items) {
      // Find the item allocation for the godown (For MVP we assume the Challan godownId or we look up allocations)
      // Since challan.godownId is optional, in a real system we'd iterate the PickList or PackingSlip godowns.
      // We will do a generic consumption here for structural demonstration
      const qty = Number(item.quantity);

      // Consume Reservation
      if (challan.salesOrderId) {
        const reservations = await db.inventoryReservation.findMany({
          where: { reservationSourceId: challan.salesOrderId, productId: item.productId }
        });
        
        for (const res of reservations) {
          const unconsumed = Number(res.quantityReserved) - Number(res.quantityConsumed) - Number(res.quantityReleased);
          if (unconsumed > 0) {
            const toConsume = Math.min(unconsumed, qty);
            await db.inventoryReservation.update({
              where: { id: res.id },
              data: {
                quantityConsumed: { increment: toConsume },
                status: (Number(res.quantityConsumed) + toConsume >= Number(res.quantityReserved)) ? "CONSUMED" : "PARTIALLY_CONSUMED"
              }
            });
          }
        }
      }

      // We need a godown to reduce stock. If null, we'd need to look at PickListItem godowns
      if (challan.godownId) {
        const inventoryItem = await db.inventoryItem.findFirst({
          where: { organizationId, productId: item.productId, godownId: challan.godownId }
        });

        if (inventoryItem) {
          await db.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { quantity: { decrement: qty } }
          });

          await inventoryRepository.createInventoryMovement(db, organizationId, {
            productId: item.productId,
            godownId: challan.godownId,
            type: "DELIVERY_DISPATCH" as any,
            quantity: -qty,
            referenceId: challan.id
          });
        }
      }
    }

    return shipment;
  }
};
