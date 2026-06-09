import type { GoodsReceivedNoteSchema, PurchaseOrderSchema } from "./schema";

import { faker } from "@faker-js/faker";

export async function getPurchases(): Promise<{ summary: any; orders: any[] }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        summary: [
          { label: "Total PO Value", value: `₹${faker.number.int({ min: 10, max: 50 })},000,000`, detail: "YTD Spend" },
          { label: "Open Commitments", value: `₹${faker.number.int({ min: 1, max: 5 })},${faker.number.int({ min: 100, max: 999 })},000`, detail: "Pending POs" },
          { label: "Delayed Receipts", value: String(faker.number.int({ min: 0, max: 20 })), detail: "Overdue GRNs" },
          { label: "Avg Delivery Time", value: `${faker.number.int({ min: 5, max: 30 })} Days`, detail: "Supplier average" },
        ],
        orders: Array.from({ length: 25 }).map(() => ({
          id: faker.string.uuid(),
          vendor: faker.company.name(),
          number: `PO-2026-${faker.number.int({ min: 1000, max: 9999 })}`,
          orderDate: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
          expectedDate: faker.date.soon({ days: 15 }).toISOString().split('T')[0],
          status: faker.helpers.arrayElement(["draft", "pending_approval", "approved", "received", "closed"]),
          amount: faker.number.int({ min: 5000, max: 1500000 }),
          buyer: faker.person.fullName(),
        })),
      });
    }, 500);
  });
}

export async function getPurchaseById(purchaseId: string): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: purchaseId,
        number: `PO-2026-${faker.number.int({ min: 1000, max: 9999 })}`,
        vendor: faker.company.name(),
        buyer: faker.person.fullName(),
        warehouse: faker.location.city() + " Warehouse",
        status: faker.helpers.arrayElement(["pending_approval", "approved", "received"]),
        notes: faker.lorem.paragraph(),
        amount: faker.number.int({ min: 50000, max: 500000 }),
        outstandingBalance: faker.number.int({ min: 10000, max: 250000 }),
        paymentTerms: "Net 30",
        lineItems: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }).map(() => ({
          id: faker.string.uuid(),
          description: faker.commerce.productName(),
          quantity: faker.number.int({ min: 10, max: 100 }),
          receivedQuantity: faker.number.int({ min: 0, max: 10 }),
          unitPrice: faker.number.int({ min: 100, max: 5000 }),
        })),
        receipts: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }).map(() => ({
          id: faker.string.uuid(),
          reference: `GRN-${faker.number.int({ min: 1000, max: 9999 })}`,
          status: faker.helpers.arrayElement(["draft", "posted"]),
          receivedDate: faker.date.recent().toISOString().split("T")[0],
          itemsReceived: faker.number.int({ min: 1, max: 50 }),
          receivedBy: faker.person.fullName(),
        })),
        activity: [
          `Order created by ${faker.person.fullName()} on ${faker.date.recent({ days: 10 }).toISOString().split("T")[0]}`,
          `Sent to vendor ${faker.company.name()}`,
          `Awaiting delivery at warehouse`,
        ],
      });
    }, 500);
  });
}

export async function getGoodsReceivedNotes(): Promise<any[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        Array.from({ length: 15 }).map(() => ({
          id: faker.string.uuid(),
          reference: `GRN-2026-${faker.number.int({ min: 1000, max: 9999 })}`,
          purchaseOrderNumber: `PO-2026-${faker.number.int({ min: 1000, max: 9999 })}`,
          vendor: faker.company.name(),
          warehouse: faker.location.city() + " Warehouse",
          receivedDate: faker.date.recent({ days: 30 }).toISOString().split("T")[0],
          itemsReceived: faker.number.int({ min: 10, max: 500 }),
          receivedBy: faker.person.fullName(),
        }))
      );
    }, 500);
  });
}

export async function createPurchaseOrder(_input: PurchaseOrderSchema): Promise<any> {
  throw new Error("Purchase order creation is not implemented in the backend API.");
}

export async function createGoodsReceivedNote(_input: GoodsReceivedNoteSchema): Promise<any> {
  throw new Error("Goods received note creation is not implemented in the backend API.");
}
