-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'admin_adjustment';

-- AlterTable
ALTER TABLE "points_transactions" ADD COLUMN     "reason" VARCHAR(255);
