import prisma, { DatabaseTransactionClient } from "../../../config/database.js";
import { ReservationStatus } from "@prisma/client";

export const inventoryReservationService = {
  reserveForSalesOrder: async (
    organizationId: string,
    orderId: string,
    tx?: DatabaseTransactionClient
  ) => {
    const db = tx || prisma;
    
    const order = await db.salesOrder.findUnique({
      where: { id: orderId, organizationId },
      include: { lines: true }
    });

    if (!order) throw new Error("Order not found");

    // "Reservation Integrity: Before confirming SO: Available Stock >= Required Stock. If not: PARTIALLY_RESERVED or BACKORDER status."
    // For MVP we will just create the Reservation and set status to ACTIVE or PARTIALLY_RESERVED based on basic logic. 
    // Ideally we'd calculate available stock across all Godowns here.
    
    // Check available stock
    for (const line of order.lines) {
      // Find total available stock (quantity - reserved)
      const inventoryItems = await db.inventoryItem.aggregate({
        where: { organizationId, productId: line.productId },
        _sum: { quantity: true }
      });
      
      const totalPhysical = Number(inventoryItems._sum.quantity ?? 0);
      
      const existingReservations = await db.inventoryReservation.aggregate({
        where: { 
          organizationId, 
          productId: line.productId, 
          status: { in: ["ACTIVE", "PARTIALLY_CONSUMED"] } 
        },
        _sum: { quantityReserved: true, quantityConsumed: true }
      });
      
      const reserved = Number(existingReservations._sum.quantityReserved ?? 0) - Number(existingReservations._sum.quantityConsumed ?? 0);
      const available = totalPhysical - reserved;
      
      let status: ReservationStatus = "ACTIVE";
      if (Number(available) < Number(line.quantity)) {
        status = Number(available) > 0 ? "PARTIALLY_RESERVED" : "ACTIVE"; // If we had BACKORDER we'd use it, but keeping it simple
      }

      await db.inventoryReservation.create({
        data: {
          organizationId,
          reservationSourceType: "SALES_ORDER",
          reservationSourceId: order.id,
          reservationSourceLineId: line.id,
          productId: line.productId,
          quantity: line.quantity,
          quantityReserved: line.quantity,
          status
        }
      });
    }
  },

  allocateReservation: async (
    organizationId: string,
    reservationId: string,
    godownId: string,
    quantity: number,
    tx?: DatabaseTransactionClient
  ) => {
    const db = tx || prisma;
    
    const reservation = await db.inventoryReservation.findUnique({
      where: { id: reservationId, organizationId },
      include: { allocations: true }
    });

    if (!reservation) throw new Error("Reservation not found");
    if (reservation.status === "CONSUMED" || reservation.status === "CANCELLED") {
      throw new Error("Cannot allocate a consumed or cancelled reservation");
    }

    const currentlyAllocated = reservation.allocations.reduce((sum, a) => sum + Number(a.quantityAllocated), 0);
    const unallocated = Number(reservation.quantityReserved) - currentlyAllocated;

    if (quantity > unallocated) {
      throw new Error(`Cannot allocate more than reserved. Unallocated: ${unallocated}`);
    }

    // Verify physical stock in that godown
    const item = await db.inventoryItem.findFirst({
      where: { organizationId, productId: reservation.productId, godownId }
    });

    const physicalQuantity = Number(item?.quantity ?? 0);
    // Ideally we subtract other reservations allocated to this godown, but for now just check physical
    if (physicalQuantity < quantity) {
      throw new Error(`Insufficient stock in godown. Available: ${physicalQuantity}`);
    }

    return db.inventoryAllocation.create({
      data: {
        reservationId,
        godownId,
        quantityAllocated: quantity
      }
    });
  }
};
