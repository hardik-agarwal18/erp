import fs from 'fs';

let content = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// 1. Customer code, type, status
content = content.replace(
  /model Customer {[\s\S]*?name\s+String\n\s*email\s+String\?/g,
  `model Customer {
  id               String            @id @default(uuid())
  organizationId   String
  name             String
  code             String?
  type             String            @default("BUSINESS")
  status           String            @default("ACTIVE")
  email            String?`
);

// 2. InvoiceStatus
content = content.replace(
  /enum InvoiceStatus {[\s\S]*?CANCELLED\n}/g,
  `enum InvoiceStatus {
  DRAFT
  POSTED
  PARTIALLY_PAID
  PAID
  OVERDUE
  VOID
  WRITTEN_OFF
  CANCELLED
}`
);

// 3. VendorQuotationResponse awardedReason
content = content.replace(
  /isAwarded\s+Boolean\s+@default\(false\)\n\s*notes\s+String\?/g,
  `isAwarded    Boolean                     @default(false)
  awardedReason String?
  notes        String?`
);

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Schema updated successfully');
