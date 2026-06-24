import fs from 'fs';

let content = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// 1. Update FiscalYear
content = content.replace(
  /model FiscalYear \{[\s\S]*?isActive\s+Boolean\s+@default\(true\)\n/g,
  `model FiscalYear {
  id             String       @id @default(uuid())
  organizationId String
  name           String
  startDate      DateTime
  endDate        DateTime
  isActive       Boolean      @default(true)
  isClosed       Boolean      @default(false)
  closedAt       DateTime?
  closedById     String?
  periods        AccountingPeriod[]\n`
);
content = content.replace(
  /organization   Organization @relation\(fields: \[organizationId\], references: \[id\]\)\n\}/g,
  `organization   Organization @relation(fields: [organizationId], references: [id])
  closedBy       User?        @relation(fields: [closedById], references: [id])
}`
);

// 2. Add AccountingPeriod
if (!content.includes('model AccountingPeriod')) {
  content += `\n
model AccountingPeriod {
  id             String       @id @default(uuid())
  organizationId String
  fiscalYearId   String
  periodName     String
  startDate      DateTime
  endDate        DateTime
  isClosed       Boolean      @default(false)
  closedAt       DateTime?
  closedById     String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])
  fiscalYear     FiscalYear   @relation(fields: [fiscalYearId], references: [id])
  closedBy       User?        @relation(fields: [closedById], references: [id])
}
`;
}

// 3. Update JournalEntry
content = content.replace(
  /model JournalEntry \{[\s\S]*?bankTransaction BankTransaction\?\n/g,
  `model JournalEntry {
  id              String           @id @default(uuid())
  organizationId  String
  entryNumber     String
  description     String
  referenceType   String?
  referenceId     String?
  isPosted        Boolean          @default(false)
  postedAt        DateTime?
  createdAt       DateTime         @default(now())
  isReversal      Boolean          @default(false)
  reversesEntryId String?          @unique
  reversedByEntryId String?        @unique
  isAccrual       Boolean          @default(false)
  autoReversalDate DateTime?
  lines           JournalLine[]
  organization    Organization     @relation(fields: [organizationId], references: [id])
  bankTransaction BankTransaction?
  reversesEntry   JournalEntry?    @relation("ReversalRelation", fields: [reversesEntryId], references: [id])
  reversedByEntry JournalEntry?    @relation("ReversalRelation")\n`
);

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Phase 7 schema updated');
