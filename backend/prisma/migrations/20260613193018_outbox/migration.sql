/*
  Warnings:

  - You are about to drop the column `organizationId` on the `DeliveryChallanItem` table. All the data in the column will be lost.
  - You are about to drop the column `budgetLimit` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `headEmployeeId` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `EmailLog` table. All the data in the column will be lost.
  - You are about to drop the column `vendorInvoiceId` on the `GoodsReceiptNote` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `GoodsReceiptNoteItem` table. All the data in the column will be lost.
  - You are about to drop the column `averageCost` on the `InventoryValuationSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `godownId` on the `InventoryValuationSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `month` on the `InventoryValuationSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `InventoryValuationSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `InventoryValuationSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `snapshotDate` on the `InventoryValuationSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `totalValue` on the `InventoryValuationSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `InventoryValuationSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `InvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `InvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `exchangeRate` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `reversalForId` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `sourceEventId` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `JournalEntry` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `JournalLine` table. All the data in the column will be lost.
  - You are about to drop the column `error` on the `OutboxEvent` table. All the data in the column will be lost.
  - The `status` column on the `OutboxEvent` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `customerId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `PayslipLineItem` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `PurchaseOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `PurchaseOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `StockJournalItem` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `StockVerificationItem` table. All the data in the column will be lost.
  - You are about to drop the column `grnItemId` on the `VendorInvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `VendorInvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `VendorInvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the `AccountingPeriod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BankAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BankReconciliation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BankStatement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BankTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CreditNote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CreditNoteItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DebitNote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DebitNoteItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DefaultAccountMapping` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExpenseClaim` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentAllocation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `payload` to the `InventoryValuationSnapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalInventoryValue` to the `InventoryValuationSnapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valuationDate` to the `InventoryValuationSnapshot` table without a default value. This is not possible if the table is not empty.
  - Made the column `invoiceId` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "BalanceType" AS ENUM ('DEBIT', 'CREDIT');

-- DropForeignKey
ALTER TABLE "AccountingPeriod" DROP CONSTRAINT "AccountingPeriod_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorUserId_fkey";

-- DropForeignKey
ALTER TABLE "BankAccount" DROP CONSTRAINT "BankAccount_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "BankReconciliation" DROP CONSTRAINT "BankReconciliation_bankStatementId_fkey";

-- DropForeignKey
ALTER TABLE "BankReconciliation" DROP CONSTRAINT "BankReconciliation_bankTransactionId_fkey";

-- DropForeignKey
ALTER TABLE "BankReconciliation" DROP CONSTRAINT "BankReconciliation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "BankReconciliation" DROP CONSTRAINT "BankReconciliation_reconciledById_fkey";

-- DropForeignKey
ALTER TABLE "BankStatement" DROP CONSTRAINT "BankStatement_bankAccountId_fkey";

-- DropForeignKey
ALTER TABLE "BankStatement" DROP CONSTRAINT "BankStatement_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "BankTransaction" DROP CONSTRAINT "BankTransaction_bankAccountId_fkey";

-- DropForeignKey
ALTER TABLE "CreditNote" DROP CONSTRAINT "CreditNote_customerId_fkey";

-- DropForeignKey
ALTER TABLE "CreditNote" DROP CONSTRAINT "CreditNote_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "CreditNote" DROP CONSTRAINT "CreditNote_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "CreditNoteItem" DROP CONSTRAINT "CreditNoteItem_creditNoteId_fkey";

-- DropForeignKey
ALTER TABLE "CreditNoteItem" DROP CONSTRAINT "CreditNoteItem_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "CreditNoteItem" DROP CONSTRAINT "CreditNoteItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "DebitNote" DROP CONSTRAINT "DebitNote_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "DebitNote" DROP CONSTRAINT "DebitNote_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "DebitNote" DROP CONSTRAINT "DebitNote_vendorInvoiceId_fkey";

-- DropForeignKey
ALTER TABLE "DebitNoteItem" DROP CONSTRAINT "DebitNoteItem_debitNoteId_fkey";

-- DropForeignKey
ALTER TABLE "DebitNoteItem" DROP CONSTRAINT "DebitNoteItem_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "DebitNoteItem" DROP CONSTRAINT "DebitNoteItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "DefaultAccountMapping" DROP CONSTRAINT "DefaultAccountMapping_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "DeliveryChallanItem" DROP CONSTRAINT "DeliveryChallanItem_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "EmailLog" DROP CONSTRAINT "EmailLog_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ExpenseClaim" DROP CONSTRAINT "ExpenseClaim_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "ExpenseClaim" DROP CONSTRAINT "ExpenseClaim_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "ExpenseClaim" DROP CONSTRAINT "ExpenseClaim_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "GoodsReceiptNote" DROP CONSTRAINT "GoodsReceiptNote_vendorInvoiceId_fkey";

-- DropForeignKey
ALTER TABLE "GoodsReceiptNoteItem" DROP CONSTRAINT "GoodsReceiptNoteItem_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryValuationSnapshot" DROP CONSTRAINT "InventoryValuationSnapshot_godownId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryValuationSnapshot" DROP CONSTRAINT "InventoryValuationSnapshot_productId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_customerId_fkey";

-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "JournalLine" DROP CONSTRAINT "JournalLine_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentAllocation" DROP CONSTRAINT "PaymentAllocation_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentAllocation" DROP CONSTRAINT "PaymentAllocation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentAllocation" DROP CONSTRAINT "PaymentAllocation_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "PayslipLineItem" DROP CONSTRAINT "PayslipLineItem_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "StockJournalItem" DROP CONSTRAINT "StockJournalItem_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "StockVerificationItem" DROP CONSTRAINT "StockVerificationItem_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "VendorInvoiceItem" DROP CONSTRAINT "VendorInvoiceItem_grnItemId_fkey";

-- DropForeignKey
ALTER TABLE "VendorInvoiceItem" DROP CONSTRAINT "VendorInvoiceItem_organizationId_fkey";

-- DropIndex
DROP INDEX "DeliveryChallanItem_organizationId_challanId_idx";

-- DropIndex
DROP INDEX "EmailLog_organizationId_idx";

-- DropIndex
DROP INDEX "GoodsReceiptNoteItem_organizationId_grnId_idx";

-- DropIndex
DROP INDEX "InventoryMovement_organizationId_productId_godownId_created_idx";

-- DropIndex
DROP INDEX "InventoryValuationSnapshot_organizationId_month_year_idx";

-- DropIndex
DROP INDEX "InventoryValuationSnapshot_organizationId_productId_godownI_key";

-- DropIndex
DROP INDEX "InvoiceItem_organizationId_invoiceId_idx";

-- DropIndex
DROP INDEX "InvoiceItem_organizationId_productId_idx";

-- DropIndex
DROP INDEX "JournalEntry_sourceEventId_key";

-- DropIndex
DROP INDEX "JournalLine_entryId_idx";

-- DropIndex
DROP INDEX "JournalLine_organizationId_accountId_idx";

-- DropIndex
DROP INDEX "OutboxEvent_organizationId_status_idx";

-- DropIndex
DROP INDEX "Payment_customerId_idx";

-- DropIndex
DROP INDEX "PayslipLineItem_organizationId_payslipId_idx";

-- DropIndex
DROP INDEX "PurchaseOrderItem_organizationId_productId_idx";

-- DropIndex
DROP INDEX "PurchaseOrderItem_organizationId_purchaseOrderId_idx";

-- DropIndex
DROP INDEX "StockJournalItem_organizationId_journalId_idx";

-- DropIndex
DROP INDEX "StockVerificationItem_organizationId_verificationId_idx";

-- DropIndex
DROP INDEX "VendorInvoiceItem_organizationId_grnItemId_idx";

-- DropIndex
DROP INDEX "VendorInvoiceItem_organizationId_invoiceId_idx";

-- DropIndex
DROP INDEX "VendorInvoiceItem_organizationId_productId_idx";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "normalBalance" "BalanceType" NOT NULL DEFAULT 'DEBIT';

-- AlterTable
ALTER TABLE "DeliveryChallanItem" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "budgetLimit",
DROP COLUMN "headEmployeeId";

-- AlterTable
ALTER TABLE "EmailLog" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "GoodsReceiptNote" DROP COLUMN "vendorInvoiceId";

-- AlterTable
ALTER TABLE "GoodsReceiptNoteItem" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "InventoryValuationSnapshot" DROP COLUMN "averageCost",
DROP COLUMN "godownId",
DROP COLUMN "month",
DROP COLUMN "productId",
DROP COLUMN "quantity",
DROP COLUMN "snapshotDate",
DROP COLUMN "totalValue",
DROP COLUMN "year",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "payload" JSONB NOT NULL,
ADD COLUMN     "totalInventoryValue" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "valuationDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "organizationId",
DROP COLUMN "taxRate";

-- AlterTable
ALTER TABLE "JournalEntry" DROP COLUMN "currency",
DROP COLUMN "exchangeRate",
DROP COLUMN "reversalForId",
DROP COLUMN "sourceEventId",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "JournalLine" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "OutboxEvent" DROP COLUMN "error",
ADD COLUMN     "causationId" TEXT,
ADD COLUMN     "correlationId" TEXT,
ADD COLUMN     "eventVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "nextRetryAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "customerId",
ALTER COLUMN "invoiceId" SET NOT NULL;

-- AlterTable
ALTER TABLE "PayslipLineItem" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "PurchaseOrderItem" DROP COLUMN "organizationId",
DROP COLUMN "taxRate";

-- AlterTable
ALTER TABLE "StockJournalItem" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "StockVerificationItem" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "VendorInvoiceItem" DROP COLUMN "grnItemId",
DROP COLUMN "organizationId",
DROP COLUMN "taxRate";

-- DropTable
DROP TABLE "AccountingPeriod";

-- DropTable
DROP TABLE "BankAccount";

-- DropTable
DROP TABLE "BankReconciliation";

-- DropTable
DROP TABLE "BankStatement";

-- DropTable
DROP TABLE "BankTransaction";

-- DropTable
DROP TABLE "CreditNote";

-- DropTable
DROP TABLE "CreditNoteItem";

-- DropTable
DROP TABLE "DebitNote";

-- DropTable
DROP TABLE "DebitNoteItem";

-- DropTable
DROP TABLE "DefaultAccountMapping";

-- DropTable
DROP TABLE "ExpenseClaim";

-- DropTable
DROP TABLE "PaymentAllocation";

-- DropEnum
DROP TYPE "AccountingPeriodStatus";

-- DropEnum
DROP TYPE "BankStatementStatus";

-- DropEnum
DROP TYPE "CreditNoteStatus";

-- DropEnum
DROP TYPE "DebitNoteStatus";

-- DropEnum
DROP TYPE "ExpenseClaimStatus";

-- DropEnum
DROP TYPE "JournalStatus";

-- DropEnum
DROP TYPE "OutboxStatus";

-- CreateTable
CREATE TABLE "SystemAccountMapping" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "mappingKey" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "SystemAccountMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialStatementSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "statementType" TEXT NOT NULL,
    "fiscalYearId" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT NOT NULL,
    "statementHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "FinancialStatementSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemAccountMapping_organizationId_mappingKey_key" ON "SystemAccountMapping"("organizationId", "mappingKey");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceItem_productId_idx" ON "InvoiceItem"("productId");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_nextRetryAt_idx" ON "OutboxEvent"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_organizationId_idx" ON "OutboxEvent"("organizationId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAccountMapping" ADD CONSTRAINT "SystemAccountMapping_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAccountMapping" ADD CONSTRAINT "SystemAccountMapping_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialStatementSnapshot" ADD CONSTRAINT "FinancialStatementSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
