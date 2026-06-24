import fs from 'fs';

let content = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// 1. Add PAYMENT_BATCH to WorkflowEntityType
content = content.replace(
  /enum WorkflowEntityType \{[\s\S]*?JOURNAL_ENTRY\n\}/g,
  `enum WorkflowEntityType {
  PURCHASE_ORDER
  PURCHASE_REQUISITION
  EXPENSE
  LEAVE_REQUEST
  CUSTOMER_CREDIT_LIMIT
  VENDOR_ONBOARDING
  ADVANCE_PAYMENT
  JOURNAL_ENTRY
  PAYMENT_BATCH
}`
);

// 2. Add WIRE_TRANSFER to PaymentMethod
content = content.replace(
  /enum PaymentMethod \{[\s\S]*?OTHER\n\}/g,
  `enum PaymentMethod {
  CASH
  BANK_TRANSFER
  UPI
  CARD
  CHEQUE
  WIRE_TRANSFER
  OTHER
}`
);

// 3. Add VendorPaymentStatus and PaymentBatch Enums
if (!content.includes('enum VendorPaymentStatus')) {
  content = content.replace(
    /enum VendorInvoiceStatus/g,
    `enum VendorPaymentStatus {
  PLANNED
  POSTED
  CANCELLED
}

enum PaymentBatchStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  EXECUTING
  EXECUTED
  CANCELLED
}

enum VendorInvoiceStatus`
  );
}

// 4. Update VendorPayment to include status
content = content.replace(
  /model VendorPayment \{[\s\S]*?bankAccountId\s+String\?\n/g,
  `model VendorPayment {
  id             String        @id @default(uuid())
  organizationId String
  vendorId       String
  amount         Decimal
  paymentMethod  PaymentMethod
  paymentDate    DateTime
  reference      String?
  bankAccountId  String?
  status         VendorPaymentStatus @default(PLANNED)\n`
);

// 5. Add VendorInvoiceMismatch to VendorInvoice
content = content.replace(
  /model VendorInvoice \{[\s\S]*?allocations\s+VendorPaymentAllocation\[\]\n/g,
  `model VendorInvoice {
  id              String              @id @default(uuid())
  organizationId  String
  vendorId        String
  purchaseOrderId String?
  invoiceNumber   String
  status          VendorInvoiceStatus
  matchStatus     MatchStatus         @default(MATCHED)
  invoiceDate     DateTime
  dueDate         DateTime?
  notes           String?
  subtotal        Decimal
  taxAmount       Decimal
  discountAmount  Decimal
  totalAmount     Decimal
  items           VendorInvoiceItem[]
  allocations     VendorPaymentAllocation[]
  mismatch        VendorInvoiceMismatch?\n`
);

// 6. Append New Models at the end
if (!content.includes('model PaymentBatch')) {
  content += `\n
model PaymentBatch {
  id              String   @id @default(uuid())
  organizationId  String
  batchNumber     String
  status          PaymentBatchStatus @default(DRAFT)
  totalAmount     Decimal  @default(0)
  totalInvoices   Int      @default(0)
  totalVendors    Int      @default(0)
  currency        String   @default("INR")
  bankAccountId   String
  scheduledDate   DateTime
  executedAt      DateTime?
  executedById    String?
  bankFileS3Key   String?
  items           PaymentBatchItem[]
  executions      PaymentBatchExecution[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  organization    Organization @relation(fields: [organizationId], references: [id])
  bankAccount     BankAccount  @relation(fields: [bankAccountId], references: [id])
  executedBy      User?        @relation(fields: [executedById], references: [id])
}

model PaymentBatchItem {
  id              String   @id @default(uuid())
  paymentBatchId  String
  vendorId        String
  invoiceId       String
  amount          Decimal
  paymentBatch    PaymentBatch @relation(fields: [paymentBatchId], references: [id], onDelete: Cascade)
  vendor          Vendor       @relation(fields: [vendorId], references: [id])
  invoice         VendorInvoice @relation(fields: [invoiceId], references: [id])
}

model PaymentBatchExecution {
  id              String   @id @default(uuid())
  batchId         String
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  successCount    Int      @default(0)
  failureCount    Int      @default(0)
  status          String   @default("IN_PROGRESS")
  batch           PaymentBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)
}

model VendorInvoiceMismatch {
  id               String @id @default(uuid())
  invoiceId        String @unique
  quantityVariance Decimal
  amountVariance   Decimal
  taxVariance      Decimal
  mismatchReason   String?
  resolvedAt       DateTime?
  resolvedById     String?
  invoice          VendorInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  resolvedBy       User?         @relation(fields: [resolvedById], references: [id])
}
`;
}

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Phase 6 schema updated');
