-- CreateEnum
CREATE TYPE "ExpenseClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'REIMBURSED');

-- CreateTable
CREATE TABLE "ExpenseClaim" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "receiptUrl" TEXT,
    "status" "ExpenseClaimStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "reimbursedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseClaim_organizationId_employeeId_idx" ON "ExpenseClaim"("organizationId", "employeeId");

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
