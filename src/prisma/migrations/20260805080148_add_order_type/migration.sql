/*
  Warnings:

  - You are about to drop the column `discount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `orders` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('PICKUP', 'DELIVERY');

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "discount",
DROP COLUMN "subtotal",
ADD COLUMN     "type" "OrderType" NOT NULL DEFAULT 'PICKUP';
