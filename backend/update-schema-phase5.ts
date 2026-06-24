import fs from 'fs';

let content = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// 1. VendorInvoiceStatus replacement
content = content.replace(
  /enum VendorInvoiceStatus \{[\s\S]*?DISPUTED\n\}/g,
  `enum VendorInvoiceStatus {
  DRAFT
  PENDING_MATCH
  MATCHED
  POSTED
  PARTIALLY_PAID
  PAID
  VOID
}`
);

// 2. Insert MatchStatus enum if not exists
if (!content.includes('enum MatchStatus')) {
  content = content.replace(
    /enum VendorInvoiceStatus/g,
    `enum MatchStatus {
  MATCHED
  PARTIAL_MATCH
  MISMATCH
}

enum VendorInvoiceStatus`
  );
}

// 3. Update VendorInvoiceItem
content = content.replace(
  /model VendorInvoiceItem \{[\s\S]*?product\s+Product\s+@relation\(fields: \[productId\], references: \[id\]\)\n\}/g,
  `model VendorInvoiceItem {
  id        String        @id @default(uuid())
  invoiceId String
  productId String
  poItemId  String?
  grnItemId String?
  quantity  Decimal
  unitPrice Decimal
  matchStatus MatchStatus @default(MATCHED)
  invoice   VendorInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  product   Product       @relation(fields: [productId], references: [id])
}`
);

// 4. Update VendorInvoice
content = content.replace(
  /model VendorInvoice \{[\s\S]*?vendorPayments\s+VendorPayment\[\]\n\}/g,
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
  organization    Organization        @relation(fields: [organizationId], references: [id])
  vendor          Vendor              @relation(fields: [vendorId], references: [id])
  purchaseOrder   PurchaseOrder?      @relation(fields: [purchaseOrderId], references: [id])
}`
);

// 5. Update VendorPayment and add VendorPaymentAllocation
content = content.replace(
  /model VendorPayment \{[\s\S]*?@@index\(\[invoiceId\]\)\n\}/g,
  `model VendorPayment {
  id             String        @id @default(uuid())
  organizationId String
  vendorId       String
  amount         Decimal
  paymentMethod  PaymentMethod
  paymentDate    DateTime
  reference      String?
  bankAccountId  String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?
  vendor         Vendor        @relation(fields: [vendorId], references: [id])
  organization   Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  bankAccount    BankAccount?  @relation(fields: [bankAccountId], references: [id])
  allocations    VendorPaymentAllocation[]

  @@index([organizationId])
  @@index([organizationId, paymentDate])
  @@index([vendorId])
}

model VendorPaymentAllocation {
  id              String        @id @default(uuid())
  organizationId  String
  paymentId       String
  invoiceId       String
  amount          Decimal
  allocatedAt     DateTime      @default(now())
  payment         VendorPayment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  invoice         VendorInvoice @relation(fields: [invoiceId], references: [id])
  organization    Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}`
);

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Phase 5 schema updated');
