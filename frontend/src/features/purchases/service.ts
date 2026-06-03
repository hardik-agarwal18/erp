import type { GoodsReceivedNoteSchema, PurchaseOrderSchema } from "./schema";

export async function getPurchases(): Promise<{ summary: any; orders: any[] }> {
  throw new Error("Purchase order APIs are not implemented in the backend. This frontend route cannot be connected without a real server module.");
}

export async function getPurchaseById(_purchaseId: string): Promise<any> {
  throw new Error("Purchase order detail APIs are not implemented in the backend. This frontend route cannot be connected without a real server module.");
}

export async function getGoodsReceivedNotes(): Promise<any[]> {
  throw new Error("Goods received note APIs are not implemented in the backend. This frontend route cannot be connected without a real server module.");
}

export async function createPurchaseOrder(_input: PurchaseOrderSchema): Promise<any> {
  throw new Error("Purchase order creation is not implemented in the backend API.");
}

export async function createGoodsReceivedNote(_input: GoodsReceivedNoteSchema): Promise<any> {
  throw new Error("Goods received note creation is not implemented in the backend API.");
}
