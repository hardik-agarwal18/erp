import fs from 'fs';

let content = fs.readFileSync('prisma/schema.prisma', 'utf-8');

// Phase 5 Additions
if (!content.includes('enum MatchStatus')) {
  content = content.replace(
    /enum VendorInvoiceStatus \{[\s\S]*?\}\n/,
    `enum MatchStatus {
  MATCHED
  PARTIAL_MATCH
  MISMATCH
}

enum VendorInvoiceStatus {
  DRAFT
  PENDING_MATCH
  MATCHED
  POSTED
  PARTIALLY_PAID
  PAID
  VOID
}\n`
  );
}

// VendorPaymentAllocation
if (!content.includes('model VendorPaymentAllocation')) {
  content += `\n
model VendorPaymentAllocation {
  id             String        @id @default(uuid())
  paymentId      String
  invoiceId      String
  amount         Decimal
  createdAt      DateTime      @default(now())

  payment        VendorPayment @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  invoice        VendorInvoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([paymentId])
  @@index([invoiceId])
}\n`;
}

// VendorInvoice Items Match Status
content = content.replace(
  /model VendorInvoiceItem \{[\s\S]*?quantity\s+Decimal\n/g,
  (match) => {
    if (match.includes('matchStatus')) return match;
    return match + `  matchStatus    MatchStatus @default(MATCHED)\n`;
  }
);

// VendorInvoice Match Status and Allocations
content = content.replace(
  /model VendorInvoice \{[\s\S]*?items\s+VendorInvoiceItem\[\]\n/g,
  (match) => {
    if (!match.includes('matchStatus')) {
      match = match.replace(/status\s+VendorInvoiceStatus\n/, `status          VendorInvoiceStatus\n  matchStatus     MatchStatus         @default(MATCHED)\n`);
    }
    if (!match.includes('allocations')) {
      match = match + `  allocations     VendorPaymentAllocation[]\n`;
    }
    return match;
  }
);

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Restored Phase 5 Schema');
