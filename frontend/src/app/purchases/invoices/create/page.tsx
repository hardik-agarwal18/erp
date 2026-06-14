import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { VendorInvoiceForm } from "@/features/purchases/components/vendor-invoice-form";

export default function CreateVendorBillPage() {
  return (
    <AppShell activePath="/purchases/invoices">
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full">
        <PageHeader
          title="Record Vendor Bill"
          description="Create a new invoice from a supplier and optionally link it to a Purchase Order for 3-way matching."
        />
        <VendorInvoiceForm />
      </div>
    </AppShell>
  );
}
