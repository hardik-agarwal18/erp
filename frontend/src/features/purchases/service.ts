import type { GoodsReceivedNoteSchema, PurchaseOrderSchema } from "./schema";

export async function getPurchases(): Promise<{ summary: any; orders: any[] }> {
  return new Promise((resolve) => {
    resolve({
      summary: [
        { label: "Total PO Value", value: `₹0`, detail: "YTD Spend" },
        { label: "Open Commitments", value: `₹0`, detail: "Pending POs" },
        { label: "Delayed Receipts", value: "0", detail: "Overdue GRNs" },
        { label: "Avg Delivery Time", value: `0 Days`, detail: "Supplier average" },
      ],
      orders: [],
    });
  });
}

export async function getPurchaseById(purchaseId: string): Promise<any> {
  throw new Error("Not implemented in backend");
}

export async function getGoodsReceivedNotes(): Promise<any[]> {
  return new Promise((resolve) => {
    resolve([]);
  });
}

export async function createPurchaseOrder(_input: PurchaseOrderSchema): Promise<any> {
  throw new Error("Purchase order creation is not implemented in the backend API.");
}

export async function createGoodsReceivedNote(_input: GoodsReceivedNoteSchema): Promise<any> {
  throw new Error("Goods received note creation is not implemented in the backend API.");
}
