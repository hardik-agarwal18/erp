
import { SerialNumberStatus } from "@prisma/client";

export interface SerialNumberFilters {
  search?: string; // matches serialNumber
  productId?: string;
  godownId?: string;
  status?: SerialNumberStatus;
  batchId?: string;
}

export interface SerialTraceabilityRecord {
  date: Date;
  eventType: string;
  referenceId?: string;
  godown?: string;
  customer?: string;
}
