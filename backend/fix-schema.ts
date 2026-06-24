import fs from 'fs';

let content = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// Fix EmployeeSequence closedBy
content = content.replace(
  /model EmployeeSequence \{[\s\S]*?closedBy       User\?        @relation\(fields: \[closedById\], references: \[id\]\)\n\}/g,
  `model EmployeeSequence {
  id             String       @id @default(uuid())
  organizationId String       @unique
  nextNumber     Int          @default(1)
  prefix         String       @default("EMP")
  organization   Organization @relation(fields: [organizationId], references: [id])
}`
);

// Fix JournalEntry Reversal duplicates
content = content.replace(
  /  reversesEntry   JournalEntry\?    @relation\("ReversalRelation", fields: \[reversesEntryId\], references: \[id\]\)\n  reversedByEntry JournalEntry\?    @relation\("ReversalRelation"\)\n  reversesEntry     JournalEntry\?    @relation\("ReversalRelation", fields: \[reversesEntryId\], references: \[id\]\)\n  reversedByEntry   JournalEntry\?    @relation\("ReversalRelation"\)/g,
  `  reversesEntry     JournalEntry?    @relation("ReversalRelation", fields: [reversesEntryId], references: [id])
  reversedByEntry   JournalEntry?    @relation("ReversalRelation")`
);

// Fix FiscalYear duplicates
content = content.replace(
  /  isActive       Boolean      @default\(true\)\n  isClosed       Boolean      @default\(false\)\n  closedAt       DateTime\?\n  closedById     String\?\n  periods        AccountingPeriod\[\]\n  isClosed       Boolean            @default\(false\)\n  closedAt       DateTime\?\n  closedById     String\?\n  organization   Organization @relation\(fields: \[organizationId\], references: \[id\]\)\n  closedBy       User\?              @relation\(fields: \[closedById\], references: \[id\]\)\n  periods        AccountingPeriod\[\]/g,
  `  isActive       Boolean      @default(true)
  isClosed       Boolean      @default(false)
  closedAt       DateTime?
  closedById     String?
  organization   Organization @relation(fields: [organizationId], references: [id])
  closedBy       User?        @relation(fields: [closedById], references: [id])
  periods        AccountingPeriod[]`
);

// Fix VendorPayment Status
content = content.replace(
  /  status         VendorPaymentStatus @default\(PLANNED\)\n  status         VendorPaymentStatus @default\(PLANNED\)/g,
  `  status         VendorPaymentStatus @default(PLANNED)`
);

// Fix invoiceId in VendorPayment (if exists)
content = content.replace(
  /  invoice      VendorInvoice @relation\(fields: \[invoiceId\], references: \[id\], onDelete: Cascade\)\n/g,
  ``
);

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Fixed duplicates in schema.prisma');
