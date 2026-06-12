-- AlterEnum
BEGIN;
CREATE TYPE "ApprovalStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
ALTER TABLE "public"."ApprovalInstance" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ApprovalInstance" ALTER COLUMN "status" TYPE "ApprovalStatus_new" USING ("status"::text::"ApprovalStatus_new");
ALTER TYPE "ApprovalStatus" RENAME TO "ApprovalStatus_old";
ALTER TYPE "ApprovalStatus_new" RENAME TO "ApprovalStatus";
DROP TYPE "public"."ApprovalStatus_old";
ALTER TABLE "ApprovalInstance" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ComponentCalculationType" ADD VALUE 'FLAT_AMOUNT';
ALTER TYPE "ComponentCalculationType" ADD VALUE 'PERCENTAGE_OF_GROSS';

-- AlterEnum
BEGIN;
CREATE TYPE "EmployeeStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED', 'SUSPENDED', 'PROBATION');
ALTER TABLE "Employee" ALTER COLUMN "status" TYPE "EmployeeStatus_new" USING ("status"::text::"EmployeeStatus_new");
ALTER TYPE "EmployeeStatus" RENAME TO "EmployeeStatus_old";
ALTER TYPE "EmployeeStatus_new" RENAME TO "EmployeeStatus";
DROP TYPE "public"."EmployeeStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EmploymentType_new" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE');
ALTER TABLE "Employee" ALTER COLUMN "employmentType" TYPE "EmploymentType_new" USING ("employmentType"::text::"EmploymentType_new");
ALTER TYPE "EmploymentType" RENAME TO "EmploymentType_old";
ALTER TYPE "EmploymentType_new" RENAME TO "EmploymentType";
DROP TYPE "public"."EmploymentType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "InventoryMovementType_new" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'TRANSFER', 'GRN_RECEIPT');
ALTER TABLE "InventoryMovement" ALTER COLUMN "type" TYPE "InventoryMovementType_new" USING ("type"::text::"InventoryMovementType_new");
ALTER TYPE "InventoryMovementType" RENAME TO "InventoryMovementType_old";
ALTER TYPE "InventoryMovementType_new" RENAME TO "InventoryMovementType";
DROP TYPE "public"."InventoryMovementType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PurchaseOrderStatus_new" AS ENUM ('DRAFT', 'ISSUED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."PurchaseOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "PurchaseOrder" ALTER COLUMN "status" TYPE "PurchaseOrderStatus_new" USING ("status"::text::"PurchaseOrderStatus_new");
ALTER TYPE "PurchaseOrderStatus" RENAME TO "PurchaseOrderStatus_old";
ALTER TYPE "PurchaseOrderStatus_new" RENAME TO "PurchaseOrderStatus";
DROP TYPE "public"."PurchaseOrderStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SerialNumberStatus_new" AS ENUM ('AVAILABLE', 'IN_USE', 'SOLD', 'DEFECTIVE', 'RETURNED');
ALTER TABLE "public"."SerialNumber" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "SerialNumber" ALTER COLUMN "status" TYPE "SerialNumberStatus_new" USING ("status"::text::"SerialNumberStatus_new");
ALTER TYPE "SerialNumberStatus" RENAME TO "SerialNumberStatus_old";
ALTER TYPE "SerialNumberStatus_new" RENAME TO "SerialNumberStatus";
DROP TYPE "public"."SerialNumberStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "VendorInvoiceStatus_new" AS ENUM ('DRAFT', 'RECEIVED', 'POSTED', 'PAID', 'OVERDUE', 'DISPUTED');
ALTER TABLE "public"."VendorInvoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "VendorInvoice" ALTER COLUMN "status" TYPE "VendorInvoiceStatus_new" USING ("status"::text::"VendorInvoiceStatus_new");
ALTER TYPE "VendorInvoiceStatus" RENAME TO "VendorInvoiceStatus_old";
ALTER TYPE "VendorInvoiceStatus_new" RENAME TO "VendorInvoiceStatus";
DROP TYPE "public"."VendorInvoiceStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WorkingDayBasis_new" AS ENUM ('FIXED_DAYS', 'ACTUAL_DAYS', 'WORKING_DAYS');
ALTER TABLE "public"."PayrollPolicy" ALTER COLUMN "workingDayBasis" DROP DEFAULT;
ALTER TABLE "PayrollPolicy" ALTER COLUMN "workingDayBasis" TYPE "WorkingDayBasis_new" USING ("workingDayBasis"::text::"WorkingDayBasis_new");
ALTER TYPE "WorkingDayBasis" RENAME TO "WorkingDayBasis_old";
ALTER TYPE "WorkingDayBasis_new" RENAME TO "WorkingDayBasis";
DROP TYPE "public"."WorkingDayBasis_old";
ALTER TABLE "PayrollPolicy" ALTER COLUMN "workingDayBasis" SET DEFAULT 'FIXED_DAYS';
COMMIT;

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ApprovalAction" DROP CONSTRAINT "ApprovalAction_instanceId_fkey";

-- DropForeignKey
ALTER TABLE "ApprovalStep" DROP CONSTRAINT "ApprovalStep_templateId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceAdjustment" DROP CONSTRAINT "AttendanceAdjustment_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "AttendancePeriod" DROP CONSTRAINT "AttendancePeriod_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "AttendancePolicy" DROP CONSTRAINT "AttendancePolicy_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "AttendanceRecord" DROP CONSTRAINT "AttendanceRecord_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_productId_fkey";

-- DropForeignKey
ALTER TABLE "BatchInventoryItem" DROP CONSTRAINT "BatchInventoryItem_batchId_fkey";

-- DropForeignKey
ALTER TABLE "BatchInventoryItem" DROP CONSTRAINT "BatchInventoryItem_godownId_fkey";

-- DropForeignKey
ALTER TABLE "BatchInventoryItem" DROP CONSTRAINT "BatchInventoryItem_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "DeliveryChallan" DROP CONSTRAINT "DeliveryChallan_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "DeliveryChallanItem" DROP CONSTRAINT "DeliveryChallanItem_batchId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Designation" DROP CONSTRAINT "Designation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeDocument" DROP CONSTRAINT "EmployeeDocument_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeSalaryStructure" DROP CONSTRAINT "EmployeeSalaryStructure_componentId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeSalaryStructure" DROP CONSTRAINT "EmployeeSalaryStructure_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeSequence" DROP CONSTRAINT "EmployeeSequence_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeShiftAssignment" DROP CONSTRAINT "EmployeeShiftAssignment_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeShiftAssignment" DROP CONSTRAINT "EmployeeShiftAssignment_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeShiftAssignment" DROP CONSTRAINT "EmployeeShiftAssignment_shiftId_fkey";

-- DropForeignKey
ALTER TABLE "FiscalYear" DROP CONSTRAINT "FiscalYear_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "GRNItem" DROP CONSTRAINT "GRNItem_batchId_fkey";

-- DropForeignKey
ALTER TABLE "GRNItem" DROP CONSTRAINT "GRNItem_grnId_fkey";

-- DropForeignKey
ALTER TABLE "GRNItem" DROP CONSTRAINT "GRNItem_poItemId_fkey";

-- DropForeignKey
ALTER TABLE "GRNItem" DROP CONSTRAINT "GRNItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "Godown" DROP CONSTRAINT "Godown_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "GoodsReceiptNote" DROP CONSTRAINT "GoodsReceiptNote_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Holiday" DROP CONSTRAINT "Holiday_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_godownId_fkey";

-- DropForeignKey
ALTER TABLE "JournalEntry" DROP CONSTRAINT "JournalEntry_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "LeaveApplication" DROP CONSTRAINT "LeaveApplication_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "LeaveBalance" DROP CONSTRAINT "LeaveBalance_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "LeaveBalance" DROP CONSTRAINT "LeaveBalance_leaveTypeId_fkey";

-- DropForeignKey
ALTER TABLE "LeaveType" DROP CONSTRAINT "LeaveType_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "PayrollPolicy" DROP CONSTRAINT "PayrollPolicy_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "PayrollRun" DROP CONSTRAINT "PayrollRun_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "PayrollRunEmployee" DROP CONSTRAINT "PayrollRunEmployee_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "PayrollRunEmployee" DROP CONSTRAINT "PayrollRunEmployee_payrollRunId_fkey";

-- DropForeignKey
ALTER TABLE "Payslip" DROP CONSTRAINT "Payslip_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "Payslip" DROP CONSTRAINT "Payslip_payrollRunId_fkey";

-- DropForeignKey
ALTER TABLE "PayslipLineItem" DROP CONSTRAINT "PayslipLineItem_payslipId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_poId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "SalaryComponent" DROP CONSTRAINT "SalaryComponent_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "SalaryStructureHistory" DROP CONSTRAINT "SalaryStructureHistory_componentId_fkey";

-- DropForeignKey
ALTER TABLE "SalaryStructureHistory" DROP CONSTRAINT "SalaryStructureHistory_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "SerialNumber" DROP CONSTRAINT "SerialNumber_godownId_fkey";

-- DropForeignKey
ALTER TABLE "SerialNumber" DROP CONSTRAINT "SerialNumber_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "SerialNumber" DROP CONSTRAINT "SerialNumber_productId_fkey";

-- DropForeignKey
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "StockGroup" DROP CONSTRAINT "StockGroup_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "StockJournal" DROP CONSTRAINT "StockJournal_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "StockJournalItem" DROP CONSTRAINT "StockJournalItem_batchId_fkey";

-- DropForeignKey
ALTER TABLE "StockVerification" DROP CONSTRAINT "StockVerification_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "StockVerificationItem" DROP CONSTRAINT "StockVerificationItem_batchId_fkey";

-- DropForeignKey
ALTER TABLE "VendorInvoice" DROP CONSTRAINT "VendorInvoice_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "VendorInvoiceItem" DROP CONSTRAINT "VendorInvoiceItem_poItemId_fkey";

-- DropIndex
DROP INDEX "Account_organizationId_idx";

-- DropIndex
DROP INDEX "ApprovalAction_actorId_idx";

-- DropIndex
DROP INDEX "ApprovalAction_instanceId_idx";

-- DropIndex
DROP INDEX "ApprovalAction_stepId_idx";

-- DropIndex
DROP INDEX "ApprovalInstance_organizationId_entityType_entityId_idx";

-- DropIndex
DROP INDEX "ApprovalInstance_organizationId_idx";

-- DropIndex
DROP INDEX "ApprovalStep_templateId_idx";

-- DropIndex
DROP INDEX "ApprovalStep_templateId_order_key";

-- DropIndex
DROP INDEX "ApprovalTemplate_organizationId_idx";

-- DropIndex
DROP INDEX "AttendanceAdjustment_date_idx";

-- DropIndex
DROP INDEX "AttendanceAdjustment_employeeId_idx";

-- DropIndex
DROP INDEX "AttendanceAdjustment_organizationId_idx";

-- DropIndex
DROP INDEX "AttendancePeriod_organizationId_idx";

-- DropIndex
DROP INDEX "AttendancePeriod_status_idx";

-- DropIndex
DROP INDEX "AttendancePolicy_organizationId_idx";

-- DropIndex
DROP INDEX "AttendanceRecord_date_idx";

-- DropIndex
DROP INDEX "AttendanceRecord_employeeId_idx";

-- DropIndex
DROP INDEX "AttendanceRecord_organizationId_idx";

-- DropIndex
DROP INDEX "AttendanceRecord_status_idx";

-- DropIndex
DROP INDEX "Batch_organizationId_idx";

-- DropIndex
DROP INDEX "Batch_organizationId_productId_batchNumber_key";

-- DropIndex
DROP INDEX "BatchInventoryItem_godownId_idx";

-- DropIndex
DROP INDEX "BatchInventoryItem_organizationId_idx";

-- DropIndex
DROP INDEX "DeliveryChallan_organizationId_challanNumber_key";

-- DropIndex
DROP INDEX "DeliveryChallan_organizationId_idx";

-- DropIndex
DROP INDEX "DeliveryChallanItem_challanId_idx";

-- DropIndex
DROP INDEX "Department_organizationId_idx";

-- DropIndex
DROP INDEX "Designation_organizationId_idx";

-- DropIndex
DROP INDEX "Employee_departmentId_idx";

-- DropIndex
DROP INDEX "Employee_designationId_idx";

-- DropIndex
DROP INDEX "Employee_managerId_idx";

-- DropIndex
DROP INDEX "Employee_organizationId_employeeCode_key";

-- DropIndex
DROP INDEX "Employee_organizationId_idx";

-- DropIndex
DROP INDEX "EmployeeDocument_employeeId_idx";

-- DropIndex
DROP INDEX "EmployeeSalaryStructure_organizationId_idx";

-- DropIndex
DROP INDEX "EmployeeShiftAssignment_employeeId_idx";

-- DropIndex
DROP INDEX "EmployeeShiftAssignment_organizationId_idx";

-- DropIndex
DROP INDEX "EmployeeShiftAssignment_shiftId_idx";

-- DropIndex
DROP INDEX "FiscalYear_organizationId_idx";

-- DropIndex
DROP INDEX "FiscalYear_organizationId_name_key";

-- DropIndex
DROP INDEX "Godown_organizationId_idx";

-- DropIndex
DROP INDEX "Godown_organizationId_name_key";

-- DropIndex
DROP INDEX "GoodsReceiptNote_organizationId_grnNumber_key";

-- DropIndex
DROP INDEX "GoodsReceiptNote_organizationId_idx";

-- DropIndex
DROP INDEX "GoodsReceiptNote_purchaseOrderId_idx";

-- DropIndex
DROP INDEX "Holiday_organizationId_idx";

-- DropIndex
DROP INDEX "InventoryItem_organizationId_productId_godownId_key";

-- DropIndex
DROP INDEX "InventoryMovement_organizationId_godownId_idx";

-- DropIndex
DROP INDEX "JournalEntry_organizationId_idx";

-- DropIndex
DROP INDEX "JournalEntry_organizationId_postedAt_idx";

-- DropIndex
DROP INDEX "JournalEntry_organizationId_referenceType_referenceId_idx";

-- DropIndex
DROP INDEX "JournalLine_accountId_idx";

-- DropIndex
DROP INDEX "JournalLine_entryId_idx";

-- DropIndex
DROP INDEX "LeaveApplication_employeeId_idx";

-- DropIndex
DROP INDEX "LeaveApplication_organizationId_idx";

-- DropIndex
DROP INDEX "LeaveApplication_status_idx";

-- DropIndex
DROP INDEX "LeaveBalance_employeeId_idx";

-- DropIndex
DROP INDEX "LeaveBalance_organizationId_idx";

-- DropIndex
DROP INDEX "LeaveType_organizationId_idx";

-- DropIndex
DROP INDEX "LeaveType_organizationId_name_key";

-- DropIndex
DROP INDEX "PayrollRun_organizationId_idx";

-- DropIndex
DROP INDEX "PayrollRun_status_idx";

-- DropIndex
DROP INDEX "PayrollRunEmployee_payrollRunId_employeeId_key";

-- DropIndex
DROP INDEX "PayrollRunEmployee_payrollRunId_idx";

-- DropIndex
DROP INDEX "Payslip_employeeId_idx";

-- DropIndex
DROP INDEX "Payslip_payrollRunId_employeeId_key";

-- DropIndex
DROP INDEX "Payslip_payrollRunId_idx";

-- DropIndex
DROP INDEX "PayslipLineItem_payslipId_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_organizationId_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_organizationId_poNumber_key";

-- DropIndex
DROP INDEX "PurchaseOrder_status_idx";

-- DropIndex
DROP INDEX "PurchaseOrder_vendorId_idx";

-- DropIndex
DROP INDEX "PurchaseOrderItem_poId_idx";

-- DropIndex
DROP INDEX "PurchaseOrderItem_productId_idx";

-- DropIndex
DROP INDEX "SalaryComponent_organizationId_idx";

-- DropIndex
DROP INDEX "SalaryComponent_organizationId_name_key";

-- DropIndex
DROP INDEX "SalaryStructureHistory_employeeId_idx";

-- DropIndex
DROP INDEX "SerialNumber_godownId_idx";

-- DropIndex
DROP INDEX "SerialNumber_organizationId_idx";

-- DropIndex
DROP INDEX "SerialNumber_organizationId_serialNumber_key";

-- DropIndex
DROP INDEX "Shift_organizationId_idx";

-- DropIndex
DROP INDEX "StockGroup_organizationId_idx";

-- DropIndex
DROP INDEX "StockGroup_organizationId_name_key";

-- DropIndex
DROP INDEX "StockJournal_organizationId_idx";

-- DropIndex
DROP INDEX "StockJournal_organizationId_journalNumber_key";

-- DropIndex
DROP INDEX "StockJournalItem_journalId_idx";

-- DropIndex
DROP INDEX "StockVerification_organizationId_idx";

-- DropIndex
DROP INDEX "StockVerification_organizationId_verificationNumber_key";

-- DropIndex
DROP INDEX "StockVerificationItem_verificationId_idx";

-- DropIndex
DROP INDEX "VendorInvoice_organizationId_idx";

-- DropIndex
DROP INDEX "VendorInvoice_organizationId_vendorId_invoiceNumber_key";

-- DropIndex
DROP INDEX "VendorInvoice_purchaseOrderId_idx";

-- DropIndex
DROP INDEX "VendorInvoice_status_idx";

-- DropIndex
DROP INDEX "VendorInvoice_vendorId_idx";

-- DropIndex
DROP INDEX "VendorInvoiceItem_invoiceId_idx";

-- DropIndex
DROP INDEX "VendorInvoiceItem_poItemId_idx";

-- DropIndex
DROP INDEX "VendorInvoiceItem_productId_idx";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "ApprovalInstance" ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "currentStepOrder" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "ApprovalStep" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "approverType",
ADD COLUMN     "approverType" TEXT NOT NULL,
ALTER COLUMN "autoApprove" DROP NOT NULL,
ALTER COLUMN "autoApprove" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ApprovalTemplate" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AttendancePeriod" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "AttendancePolicy" DROP COLUMN "name",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "earlyExitGraceMinutes" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "fullDayMinutes" DROP NOT NULL,
ALTER COLUMN "fullDayMinutes" DROP DEFAULT,
ALTER COLUMN "halfDayMinutes" DROP NOT NULL,
ALTER COLUMN "halfDayMinutes" DROP DEFAULT,
ALTER COLUMN "lateGraceMinutes" DROP NOT NULL,
ALTER COLUMN "lateGraceMinutes" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AttendanceRecord" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "manufactureDate",
DROP COLUMN "updatedAt",
ADD COLUMN     "manufacturingDate" TIMESTAMP(3),
ALTER COLUMN "quantity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DeliveryChallan" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "DeliveryChallanItem" DROP COLUMN "batchId";

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "employeeCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EmployeeDocument" DROP COLUMN "expiryDate",
DROP COLUMN "uploadedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "organizationId" TEXT,
ALTER COLUMN "documentType" DROP NOT NULL,
ALTER COLUMN "fileUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EmployeeSalaryStructure" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "effectiveDate" TIMESTAMP(3),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "percentage" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "EmployeeSequence" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "prefix" TEXT NOT NULL DEFAULT 'EMP';

-- AlterTable
ALTER TABLE "FiscalYear" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Godown" DROP COLUMN "address",
DROP COLUMN "code",
DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "managerId",
DROP COLUMN "updatedAt",
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "GoodsReceiptNote" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL,
ALTER COLUMN "receivedDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Holiday" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "batchId" TEXT,
ALTER COLUMN "godownId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "InventoryMovement" DROP COLUMN "referenceType",
ADD COLUMN     "referenceType" TEXT;

-- AlterTable
ALTER TABLE "JournalEntry" DROP COLUMN "updatedAt",
ALTER COLUMN "isPosted" SET DEFAULT false,
ALTER COLUMN "postedAt" DROP NOT NULL,
ALTER COLUMN "postedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "JournalLine" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "LeaveApplication" ALTER COLUMN "totalDays" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "LeaveBalance" ALTER COLUMN "allocated" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "used" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "remaining" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "LeaveType" DROP COLUMN "isActive",
DROP COLUMN "isCarryForward",
DROP COLUMN "isEncashable",
DROP COLUMN "isPaid",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PayrollPolicy" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "workingDayBasis" SET DEFAULT 'FIXED_DAYS';

-- AlterTable
ALTER TABLE "PayrollRun" DROP COLUMN "updatedAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "totalGrossPay" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "totalDeductions" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "totalNetPay" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "PayrollRunEmployee" ALTER COLUMN "workingDays" DROP NOT NULL,
ALTER COLUMN "workingDays" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "presentDays" DROP NOT NULL,
ALTER COLUMN "presentDays" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "leaveDays" DROP NOT NULL,
ALTER COLUMN "leaveDays" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "unpaidDays" DROP NOT NULL,
ALTER COLUMN "unpaidDays" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "halfDays" DROP NOT NULL,
ALTER COLUMN "halfDays" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "overtimeHours" DROP NOT NULL,
ALTER COLUMN "overtimeHours" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "lateDays" DROP NOT NULL,
ALTER COLUMN "lateDays" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Payslip" DROP COLUMN "createdAt",
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT,
ALTER COLUMN "grossPay" DROP NOT NULL,
ALTER COLUMN "grossPay" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "totalDeductions" DROP NOT NULL,
ALTER COLUMN "totalDeductions" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "netPay" DROP NOT NULL,
ALTER COLUMN "netPay" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "PayslipLineItem" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "additionalCosts",
DROP COLUMN "costAllocationMethod",
DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "currencyCode" DROP NOT NULL,
ALTER COLUMN "exchangeRate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrderItem" DROP COLUMN "poId",
ADD COLUMN     "purchaseOrderId" TEXT NOT NULL,
ALTER COLUMN "taxAmount" DROP NOT NULL,
ALTER COLUMN "taxAmount" DROP DEFAULT,
ALTER COLUMN "discountAmount" DROP NOT NULL,
ALTER COLUMN "discountAmount" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SalaryComponent" DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "updatedAt",
ALTER COLUMN "calculationType" DROP DEFAULT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "percentage" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "SalaryStructureHistory" DROP COLUMN "recordedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "percentage" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "SerialNumber" DROP COLUMN "notes",
DROP COLUMN "soldDate",
DROP COLUMN "updatedAt",
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "godownId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Shift" DROP COLUMN "type",
ADD COLUMN     "type" TEXT,
ALTER COLUMN "breakMinutes" DROP NOT NULL,
ALTER COLUMN "breakMinutes" DROP DEFAULT,
ALTER COLUMN "lateGraceMinutes" DROP NOT NULL,
ALTER COLUMN "lateGraceMinutes" DROP DEFAULT,
ALTER COLUMN "earlyExitGraceMinutes" DROP NOT NULL,
ALTER COLUMN "earlyExitGraceMinutes" DROP DEFAULT,
ALTER COLUMN "weeklyOffDays" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "StockGroup" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "StockJournal" DROP COLUMN "updatedAt",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "StockJournalItem" DROP COLUMN "batchId",
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "StockVerification" DROP COLUMN "completedDate",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StockVerificationItem" DROP COLUMN "batchId",
DROP COLUMN "expectedQty",
DROP COLUMN "physicalQty",
DROP COLUMN "varianceQty",
ADD COLUMN     "difference" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "physicalQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "systemQuantity" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "VendorInvoice" DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "taxAmount" DROP DEFAULT,
ALTER COLUMN "discountAmount" DROP DEFAULT;

-- AlterTable
ALTER TABLE "VendorInvoiceItem" DROP COLUMN "discountAmount",
DROP COLUMN "grnItemId",
DROP COLUMN "poItemId",
ALTER COLUMN "taxAmount" DROP NOT NULL,
ALTER COLUMN "taxAmount" DROP DEFAULT;

-- DropTable
DROP TABLE "GRNItem";

-- DropEnum
DROP TYPE "DocumentStatus";

-- DropEnum
DROP TYPE "MovementReferenceType";

-- DropEnum
DROP TYPE "PeriodStatus";

-- DropEnum
DROP TYPE "ShiftType";

-- DropEnum
DROP TYPE "VerificationStatus";

-- CreateTable
CREATE TABLE "GoodsReceiptNoteItem" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "poItemId" TEXT,
    "orderedQty" DECIMAL(65,30),
    "receivedQty" DECIMAL(65,30) NOT NULL,
    "batchId" TEXT,
    "unitPrice" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "GoodsReceiptNoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttendancePolicy_organizationId_key" ON "AttendancePolicy"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeDocument_id_employeeId_key" ON "EmployeeDocument"("id", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_productId_key" ON "InventoryItem"("productId");

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSequence" ADD CONSTRAINT "EmployeeSequence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designation" ADD CONSTRAINT "Designation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeShiftAssignment" ADD CONSTRAINT "EmployeeShiftAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeShiftAssignment" ADD CONSTRAINT "EmployeeShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveApplication" ADD CONSTRAINT "LeaveApplication_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRunEmployee" ADD CONSTRAINT "PayrollRunEmployee_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRunEmployee" ADD CONSTRAINT "PayrollRunEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryStructure" ADD CONSTRAINT "EmployeeSalaryStructure_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SalaryComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryStructure" ADD CONSTRAINT "EmployeeSalaryStructure_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructureHistory" ADD CONSTRAINT "SalaryStructureHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipLineItem" ADD CONSTRAINT "PayslipLineItem_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalTemplate" ADD CONSTRAINT "ApprovalTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStep" ADD CONSTRAINT "ApprovalStep_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ApprovalTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalInstance" ADD CONSTRAINT "ApprovalInstance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalInstance" ADD CONSTRAINT "ApprovalInstance_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "ApprovalInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalYear" ADD CONSTRAINT "FiscalYear_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInvoice" ADD CONSTRAINT "VendorInvoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Godown" ADD CONSTRAINT "Godown_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNoteItem" ADD CONSTRAINT "GoodsReceiptNoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNoteItem" ADD CONSTRAINT "GoodsReceiptNoteItem_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceiptNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryChallan" ADD CONSTRAINT "DeliveryChallan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryChallan" ADD CONSTRAINT "DeliveryChallan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockGroup" ADD CONSTRAINT "StockGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockJournal" ADD CONSTRAINT "StockJournal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockVerification" ADD CONSTRAINT "StockVerification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchInventoryItem" ADD CONSTRAINT "BatchInventoryItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchInventoryItem" ADD CONSTRAINT "BatchInventoryItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchInventoryItem" ADD CONSTRAINT "BatchInventoryItem_godownId_fkey" FOREIGN KEY ("godownId") REFERENCES "Godown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
