import fs from 'fs';

let content = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// Vendor missing rating and performance
content = content.replace(
  /model Vendor {[\s\S]*?address\s+String\?/g,
  `model Vendor {
  id                         String                      @id @default(uuid())
  organizationId             String
  name                       String
  email                      String?
  phone                      String?
  gstNumber                  String?
  address                    String?
  rating                     Float                       @default(3.0)
  performance                VendorPerformance?`
);

// PurchaseOrder missing tolerance and revisionNumber and updated PurchaseOrderStatus
content = content.replace(
  /model PurchaseOrder {[\s\S]*?poNumber\s+String\n\s*status\s+PurchaseOrderStatus/g,
  `model PurchaseOrder {
  id                   String                      @id @default(uuid())
  organizationId       String
  vendorId             String
  poNumber             String
  revisionNumber       Int                         @default(1)
  status               PurchaseOrderStatus
  overReceiptTolerance Decimal?
  underReceiptTolerance Decimal?`
);

// GoodsReceiptNote missing fields and enum
content = content.replace(
  /model GoodsReceiptNote {[\s\S]*?items\s+GoodsReceiptNoteItem\[\]\n}/g,
  `model GoodsReceiptNote {
  id              String                 @id @default(uuid())
  organizationId  String
  purchaseOrderId String?
  vendorId        String?
  godownId        String
  grnNumber       String
  status          GoodsReceiptNoteStatus @default(DRAFT)
  notes           String?
  freightAmount   Decimal?
  insuranceAmount Decimal?
  customsAmount   Decimal?
  createdById     String                 @default("")
  inspectedById   String?
  postedById      String?
  inspectedAt     DateTime?
  postedAt        DateTime?
  receivedDate    DateTime               @default(now())
  deletedAt       DateTime?
  organization    Organization           @relation(fields: [organizationId], references: [id])
  vendor          Vendor?                @relation(fields: [vendorId], references: [id])
  purchaseOrder   PurchaseOrder?         @relation(fields: [purchaseOrderId], references: [id])
  godown          Godown                 @relation(fields: [godownId], references: [id])
  items           GoodsReceiptNoteItem[]
}`
);

// GoodsReceiptNoteItem missing fields
content = content.replace(
  /model GoodsReceiptNoteItem {[\s\S]*?grn\s+GoodsReceiptNote\s+@relation\(fields: \[grnId\], references: \[id\], onDelete: Cascade\)\n}/g,
  `model GoodsReceiptNoteItem {
  id                 String           @id @default(uuid())
  grnId              String
  productId          String
  poItemId           String?
  orderedQuantity    Decimal?
  receivedQuantity   Decimal
  acceptedQuantity   Decimal          @default(0)
  rejectedQuantity   Decimal          @default(0)
  rejectedDisposition RejectedItemDisposition @default(PENDING)
  inspectionComments String?
  batchId            String?
  unitPrice          Decimal
  product            Product          @relation(fields: [productId], references: [id])
  grn                GoodsReceiptNote @relation(fields: [grnId], references: [id], onDelete: Cascade)
}`
);

// PurchaseOrderStatus
content = content.replace(
  /enum PurchaseOrderStatus {[\s\S]*?CANCELLED\n}/g,
  `enum PurchaseOrderStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  SENT
  PARTIALLY_RECEIVED
  RECEIVED
  CLOSED
  CANCELLED
}`
);

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Schema updated successfully');
