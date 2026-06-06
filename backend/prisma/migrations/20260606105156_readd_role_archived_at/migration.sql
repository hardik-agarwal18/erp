-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Role_organizationId_archivedAt_idx" ON "Role"("organizationId", "archivedAt");
