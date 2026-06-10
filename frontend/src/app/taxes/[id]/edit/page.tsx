import { TaxEditView } from "@/features/taxes/components/tax-edit-view";

export default async function TaxEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaxEditView taxId={id} />;
}
