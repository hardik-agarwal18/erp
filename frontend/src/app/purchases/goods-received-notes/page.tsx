import { AppShell } from "@/components/layout/app-shell";
import { GoodsReceivedNotesView } from "@/features/purchases/components/goods-received-notes-view";

export default function GoodsReceivedNotesPage() {
  return (
    <AppShell activePath="/purchases">
      <GoodsReceivedNotesView />
    </AppShell>
  );
}
