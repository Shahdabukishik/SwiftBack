-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'Customer',
ADD COLUMN     "userName" TEXT;
