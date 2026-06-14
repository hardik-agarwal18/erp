import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse } from "@/api/types";
import type { GoodsReceivedNoteSchema, PurchaseOrderSchema } from "./schema";

export async function getPurchases(): Promise<{ summary: any; orders: any[] }> {
  try {
    const response = await apiClient.get<ApiResponse<any>>(apiEndpoints.purchases.orders.list);
    const backendOrders = response.data.data.items || response.data.data || [];
    
    const openCommitments = backendOrders.filter((o: any) => o.status === "PENDING_APPROVAL" || o.status === "APPROVED").reduce((acc: number, o: any) => acc + (Number(o.totalAmount) || 0), 0);
    const totalSpend = backendOrders.reduce((acc: number, o: any) => acc + (Number(o.totalAmount) || 0), 0);

    const orders = backendOrders.map((o: any) => ({
      id: o.id,
      vendor: o.vendor?.name || o.vendorId || "Unknown",
      number: o.orderNumber || "Draft",
      orderDate: o.createdAt?.slice(0, 10),
      expectedDate: o.expectedDeliveryDate?.slice(0, 10) || "-",
      status: o.status,
      amount: Number(o.totalAmount) || 0,
      buyer: "System" // Mocked buyer for now, could be o.createdBy user
    }));

    return {
      summary: [
        { label: "Total PO Value", value: `₹${totalSpend.toLocaleString()}`, detail: "YTD Spend" },
        { label: "Open Commitments", value: `₹${openCommitments.toLocaleString()}`, detail: "Pending POs" },
        { label: "Delayed Receipts", value: "0", detail: "Overdue GRNs" },
        { label: "Avg Delivery Time", value: `0 Days`, detail: "Supplier average" },
      ],
      orders: orders,
    };
  } catch (error) {
    console.error("Failed to fetch purchases", error);
    throw error;
  }
}

export async function getPurchaseById(purchaseId: string): Promise<any> {
  const response = await apiClient.get<ApiResponse<any>>(apiEndpoints.purchases.orders.details(purchaseId));
  return response.data.data;
}

export async function getGoodsReceivedNotes(): Promise<any[]> {
  const response = await apiClient.get<ApiResponse<any>>(apiEndpoints.inventory.grn.list);
  return response.data.data.items || response.data.data || [];
}

export async function createPurchaseOrder(input: PurchaseOrderSchema): Promise<any> {
  const payload = {
    vendorId: input.vendor, 
    expectedDeliveryDate: input.expectedDate ? new Date(input.expectedDate).toISOString() : undefined,
    notes: input.notes,
    items: input.lineItems.map(item => ({
      productId: item.description, 
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))
  };

  const response = await apiClient.post<ApiResponse<any>>(apiEndpoints.purchases.orders.create, payload);
  return response.data.data;
}

export async function createGoodsReceivedNote(input: GoodsReceivedNoteSchema): Promise<any> {
  const response = await apiClient.post<ApiResponse<any>>(apiEndpoints.inventory.grn.create, input);
  return response.data.data;
}
