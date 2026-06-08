import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Hammer } from "lucide-react";

export default function PurchasesPage() {
  return (
    <AppShell activePath="/purchases">
      <div className="space-y-6 max-w-3xl">
        <PageHeader
          title="Purchases"
          description="Manage procurement and purchase orders."
        />
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
              <Hammer className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Coming Soon</h2>
            <p className="text-slate-500 max-w-md">
              The Purchases module is currently under active development. 
              Check back soon to manage your procurement workflows, purchase orders, and supplier bills.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
