export interface Advance {
  id: string;
  organizationId: string;
  type: "EMPLOYEE" | "VENDOR" | "CUSTOMER";
  partyId: string;
  amount: number;
  outstandingAmount: number;
  status: "DRAFT" | "ISSUED" | "SETTLED" | "VOID";
  settlementDate?: string;
  notes?: string;
}
