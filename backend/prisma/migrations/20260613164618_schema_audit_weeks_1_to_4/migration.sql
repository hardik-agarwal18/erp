/*
  Warnings:

  - A unique constraint covering the columns `[sourceEventId]` on the table `JournalEntry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `DeliveryChallanItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `EmailLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `GoodsReceiptNoteItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `JournalLine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `PayslipLineItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `PurchaseOrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `StockJournalItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `StockVerificationItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `VendorInvoiceItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CreditNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'APPLIED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DebitNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'APPLIED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BankStatementStatus" AS ENUM ('DRAFT', 'RECONCILED', 'CLOSED');

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorUserId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";

-- DropIndex
DROP INDEX "InvoiceItem_invoiceId_idx";

-- DropIndex
DROP INDEX "InvoiceItem_productId_idx";

-- AlterTable
ALTER TABLE "DeliveryChallanItem" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EmailLog" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GoodsReceiptNote" ADD COLUMN     "vendorInvoiceId" TEXT;

-- AlterTable
ALTER TABLE "GoodsReceiptNoteItem" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "taxRate" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "sourceEventId" TEXT;

-- AlterTable
ALTER TABLE "JournalLine" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "customerId" TEXT,
ALTER COLUMN "invoiceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PayslipLineItem" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrderItem" ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "taxRate" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "StockJournalItem" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StockVerificationItem" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VendorInvoiceItem" ADD COLUMN     "grnItemId" TEXT,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "taxRate" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditNote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "creditNoteNumber" TEXT NOT NULL,
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "taxAmount" DECIMAL(65,30) NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditNoteItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "creditNoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "taxAmount" DECIMAL(65,30),
    "lineTotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "CreditNoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebitNote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorInvoiceId" TEXT,
    "debitNoteNumber" TEXT NOT NULL,
    "status" "DebitNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "taxAmount" DECIMAL(65,30) NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DebitNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebitNoteItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "debitNoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "taxAmount" DECIMAL(65,30),
    "lineTotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "DebitNoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankStatement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "statementDate" TIMESTAMP(3) NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "status" "BankStatementStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankReconciliation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bankStatementId" TEXT NOT NULL,
    "bankTransactionId" TEXT NOT NULL,
    "reconciledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reconciledById" TEXT,

    CONSTRAINT "BankReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryValuationSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "godownId" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "averageCost" DECIMAL(65,30) NOT NULL,
    "totalValue" DECIMAL(65,30) NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryValuationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboxEvent_organizationId_status_idx" ON "OutboxEvent"("organizationId", "status");

-- CreateIndex
CREATE INDEX "CreditNote_organizationId_idx" ON "CreditNote"("organizationId");

-- CreateIndex
CREATE INDEX "CreditNote_organizationId_customerId_idx" ON "CreditNote"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_organizationId_creditNoteNumber_key" ON "CreditNote"("organizationId", "creditNoteNumber");

-- CreateIndex
CREATE INDEX "CreditNoteItem_organizationId_creditNoteId_idx" ON "CreditNoteItem"("organizationId", "creditNoteId");

-- CreateIndex
CREATE INDEX "CreditNoteItem_organizationId_productId_idx" ON "CreditNoteItem"("organizationId", "productId");

-- CreateIndex
CREATE INDEX "DebitNote_organizationId_idx" ON "DebitNote"("organizationId");

-- CreateIndex
CREATE INDEX "DebitNote_organizationId_vendorId_idx" ON "DebitNote"("organizationId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "DebitNote_organizationId_debitNoteNumber_key" ON "DebitNote"("organizationId", "debitNoteNumber");

-- CreateIndex
CREATE INDEX "DebitNoteItem_organizationId_debitNoteId_idx" ON "DebitNoteItem"("organizationId", "debitNoteId");

-- CreateIndex
CREATE INDEX "DebitNoteItem_organizationId_productId_idx" ON "DebitNoteItem"("organizationId", "productId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_organizationId_paymentId_idx" ON "PaymentAllocation"("organizationId", "paymentId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_organizationId_invoiceId_idx" ON "PaymentAllocation"("organizationId", "invoiceId");

-- CreateIndex
CREATE INDEX "BankStatement_organizationId_bankAccountId_idx" ON "BankStatement"("organizationId", "bankAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "BankReconciliation_bankTransactionId_key" ON "BankReconciliation"("bankTransactionId");

-- CreateIndex
CREATE INDEX "BankReconciliation_organizationId_bankStatementId_idx" ON "BankReconciliation"("organizationId", "bankStatementId");

-- CreateIndex
CREATE INDEX "InventoryValuationSnapshot_organizationId_month_year_idx" ON "InventoryValuationSnapshot"("organizationId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryValuationSnapshot_organizationId_productId_godownI_key" ON "InventoryValuationSnapshot"("organizationId", "productId", "godownId", "month", "year");

-- CreateIndex
CREATE INDEX "DeliveryChallanItem_organizationId_challanId_idx" ON "DeliveryChallanItem"("organizationId", "challanId");

-- CreateIndex
CREATE INDEX "EmailLog_organizationId_idx" ON "EmailLog"("organizationId");

-- CreateIndex
CREATE INDEX "GoodsReceiptNoteItem_organizationId_grnId_idx" ON "GoodsReceiptNoteItem"("organizationId", "grnId");

-- CreateIndex
CREATE INDEX "InventoryMovement_organizationId_productId_godownId_created_idx" ON "InventoryMovement"("organizationId", "productId", "godownId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "InvoiceItem_organizationId_invoiceId_idx" ON "InvoiceItem"("organizationId", "invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceItem_organizationId_productId_idx" ON "InvoiceItem"("organizationId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_sourceEventId_key" ON "JournalEntry"("sourceEventId");

-- CreateIndex
CREATE INDEX "JournalLine_organizationId_accountId_idx" ON "JournalLine"("organizationId", "accountId");

-- CreateIndex
CREATE INDEX "JournalLine_entryId_idx" ON "JournalLine"("entryId");

-- CreateIndex
CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");

-- CreateIndex
CREATE INDEX "PayslipLineItem_organizationId_payslipId_idx" ON "PayslipLineItem"("organizationId", "payslipId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_organizationId_purchaseOrderId_idx" ON "PurchaseOrderItem"("organizationId", "purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_organizationId_productId_idx" ON "PurchaseOrderItem"("organizationId", "productId");

-- CreateIndex
CREATE INDEX "StockJournalItem_organizationId_journalId_idx" ON "StockJournalItem"("organizationId", "journalId");

-- CreateIndex
CREATE INDEX "StockVerificationItem_organizationId_verificationId_idx" ON "StockVerificationItem"("organizationId", "verificationId");

-- CreateIndex
CREATE INDEX "VendorInvoiceItem_organizationId_invoiceId_idx" ON "VendorInvoiceItem"("organizationId", "invoiceId");

-- CreateIndex
CREATE INDEX "VendorInvoiceItem_organizationId_productId_idx" ON "VendorInvoiceItem"("organizationId", "productId");

-- CreateIndex
CREATE INDEX "VendorInvoiceItem_organizationId_grnItemId_idx" ON "VendorInvoiceItem"("organizationId", "grnItemId");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipLineItem" ADD CONSTRAINT "PayslipLineItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInvoiceItem" ADD CONSTRAINT "VendorInvoiceItem_grnItemId_fkey" FOREIGN KEY ("grnItemId") REFERENCES "GoodsReceiptNoteItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInvoiceItem" ADD CONSTRAINT "VendorInvoiceItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_vendorInvoiceId_fkey" FOREIGN KEY ("vendorInvoiceId") REFERENCES "VendorInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNoteItem" ADD CONSTRAINT "GoodsReceiptNoteItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryChallanItem" ADD CONSTRAINT "DeliveryChallanItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockJournalItem" ADD CONSTRAINT "StockJournalItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockVerificationItem" ADD CONSTRAINT "StockVerificationItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNoteItem" ADD CONSTRAINT "CreditNoteItem_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "CreditNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNoteItem" ADD CONSTRAINT "CreditNoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNoteItem" ADD CONSTRAINT "CreditNoteItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebitNote" ADD CONSTRAINT "DebitNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebitNote" ADD CONSTRAINT "DebitNote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebitNote" ADD CONSTRAINT "DebitNote_vendorInvoiceId_fkey" FOREIGN KEY ("vendorInvoiceId") REFERENCES "VendorInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebitNoteItem" ADD CONSTRAINT "DebitNoteItem_debitNoteId_fkey" FOREIGN KEY ("debitNoteId") REFERENCES "DebitNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebitNoteItem" ADD CONSTRAINT "DebitNoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebitNoteItem" ADD CONSTRAINT "DebitNoteItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatement" ADD CONSTRAINT "BankStatement_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankStatement" ADD CONSTRAINT "BankStatement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReconciliation" ADD CONSTRAINT "BankReconciliation_bankStatementId_fkey" FOREIGN KEY ("bankStatementId") REFERENCES "BankStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReconciliation" ADD CONSTRAINT "BankReconciliation_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "BankTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReconciliation" ADD CONSTRAINT "BankReconciliation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReconciliation" ADD CONSTRAINT "BankReconciliation_reconciledById_fkey" FOREIGN KEY ("reconciledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryValuationSnapshot" ADD CONSTRAINT "InventoryValuationSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryValuationSnapshot" ADD CONSTRAINT "InventoryValuationSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryValuationSnapshot" ADD CONSTRAINT "InventoryValuationSnapshot_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown"("id") ON DELETE SET NULL ON UPDATE CASCADE;
