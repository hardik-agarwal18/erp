/*
  Warnings:

  - You are about to drop the column `archivedAt` on the `Role` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Role_organizationId_archivedAt_idx";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "archivedAt";
