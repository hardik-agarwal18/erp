"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { purchasesService } from "@/services/purchases.service";

export function VendorInvoiceForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    vendorId: "",
    purchaseOrderId: "",
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
  });

  const [items, setItems] = useState([
    { productId: "", poItemId: "", quantity: 1, unitPrice: 0, taxAmount: 0, discountAmount: 0 }
  ]);

  const handleAddItem = () => {
    setItems([...items, { productId: "", poItemId: "", quantity: 1, unitPrice: 0, taxAmount: 0, discountAmount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTotalTax = () => {
    return items.reduce((sum, item) => sum + Number(item.taxAmount || 0), 0);
  };

  const calculateTotalDiscount = () => {
    return items.reduce((sum, item) => sum + Number(item.discountAmount || 0), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalTax() - calculateTotalDiscount();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId || !formData.invoiceNumber) {
      toast.error("Please fill in all required fields (Vendor, Invoice Number)");
      return;
    }

    if (items.length === 0 || !items[0].productId) {
      toast.error("Please add at least one item with a valid Product ID");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        purchaseOrderId: formData.purchaseOrderId || undefined,
        dueDate: formData.dueDate || undefined,
        items: items.map(item => ({
          ...item,
          poItemId: item.poItemId || undefined,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxAmount: Number(item.taxAmount),
          discountAmount: Number(item.discountAmount),
        }))
      };

      await purchasesService.createInvoice(payload);
      toast.success("Vendor Bill created successfully");
      router.push("/purchases/invoices");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create vendor bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bill Details</CardTitle>
            <CardDescription>Enter the primary details from the vendor&apos;s invoice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendorId">Vendor ID <span className="text-red-500">*</span></Label>
                <Input 
                  id="vendorId" 
                  placeholder="Enter Vendor UUID"
                  value={formData.vendorId}
                  onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number <span className="text-red-500">*</span></Label>
                <Input 
                  id="invoiceNumber" 
                  placeholder="INV-2026-001"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date <span className="text-red-500">*</span></Label>
                <Input 
                  id="invoiceDate" 
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input 
                  id="dueDate" 
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3-Way Match References</CardTitle>
            <CardDescription>Link this bill to an existing Purchase Order for automatic matching.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseOrderId">Purchase Order ID</Label>
              <Input 
                id="purchaseOrderId" 
                placeholder="Enter PO UUID (Optional)"
                value={formData.purchaseOrderId}
                onChange={(e) => setFormData({...formData, purchaseOrderId: e.target.value})}
              />
              <p className="text-xs text-slate-500">
                If provided, the system will validate billed quantities against received quantities.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Any additional notes or terms..."
                className="resize-none h-20"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Enter the products and quantities billed by the vendor.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={handleAddItem} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-3 text-left">Product ID</th>
                  <th className="px-4 py-3 text-left">PO Item ID (Opt)</th>
                  <th className="px-4 py-3 text-right w-24">Qty</th>
                  <th className="px-4 py-3 text-right w-32">Unit Price</th>
                  <th className="px-4 py-3 text-right w-28">Tax</th>
                  <th className="px-4 py-3 text-right w-28">Disc</th>
                  <th className="px-4 py-3 text-right w-32">Total</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, index) => (
                  <tr key={index} className="group">
                    <td className="p-2">
                      <Input 
                        placeholder="Product UUID" 
                        value={item.productId} 
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        required
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        placeholder="PO Item UUID" 
                        value={item.poItemId} 
                        onChange={(e) => updateItem(index, 'poItemId', e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        type="number" 
                        min="1" 
                        value={item.quantity} 
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="text-right"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={item.unitPrice} 
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        className="text-right"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={item.taxAmount} 
                        onChange={(e) => updateItem(index, 'taxAmount', e.target.value)}
                        className="text-right"
                      />
                    </td>
                    <td className="p-2">
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={item.discountAmount} 
                        onChange={(e) => updateItem(index, 'discountAmount', e.target.value)}
                        className="text-right"
                      />
                    </td>
                    <td className="p-2 text-right font-medium">
                      ${((item.quantity * item.unitPrice) + Number(item.taxAmount) - Number(item.discountAmount)).toFixed(2)}
                    </td>
                    <td className="p-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                        className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex flex-col items-end mt-6 space-y-2 text-sm">
            <div className="flex w-64 justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex w-64 justify-between text-slate-500">
              <span>Tax Total:</span>
              <span>${calculateTotalTax().toFixed(2)}</span>
            </div>
            <div className="flex w-64 justify-between text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span>Discount Total:</span>
              <span>-${calculateTotalDiscount().toFixed(2)}</span>
            </div>
            <div className="flex w-64 justify-between font-bold text-lg pt-1">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t flex justify-end gap-3 py-4">
          <Button type="button" variant="outline" onClick={() => router.push('/purchases/invoices')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Receipt className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create Vendor Bill"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
