-- CreateEnum
CREATE TYPE "TransactionReferenceType" AS ENUM ('SIGNUP', 'PURCHASE', 'SPIN', 'REWARD', 'BIRTHDAY', 'SYSTEM');

-- AlterTable
ALTER TABLE "points_transactions" ADD COLUMN     "reference_id" TEXT,
ADD COLUMN     "reference_type" "TransactionReferenceType";

-- CreateIndex
CREATE INDEX "points_transactions_reference_type_reference_id_idx" ON "points_transactions"("reference_type", "reference_id");
