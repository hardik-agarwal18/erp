import { FileBadge2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { VendorDocument } from "@/types/app";

export function VendorDocuments({ documents }: { documents: VendorDocument[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Vendor Documents</CardTitle>
          <CardDescription>Contracts, compliance packs, bank forms, and tax records.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((document) => (
          <div key={document.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <FileBadge2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">{document.title}</p>
                <p className="text-xs text-slate-500">
                  {document.type.replace("_", " ")} · Uploaded by {document.uploadedBy}
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400">{document.uploadedAt}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
