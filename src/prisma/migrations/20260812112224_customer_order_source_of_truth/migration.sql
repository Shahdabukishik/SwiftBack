/*
  Warnings:

  - The primary key for the `customer_order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "customer_order" DROP CONSTRAINT "customer_order_customerId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_userId_fkey";

-- DropIndex
DROP INDEX "customer_order_orderId_key";

-- DropIndex
DROP INDEX "orders_userId_idx";

-- AlterTable
ALTER TABLE "customer_order" DROP CONSTRAINT "customer_order_pkey",
ALTER COLUMN "customerId" DROP NOT NULL,
ADD CONSTRAINT "customer_order_pkey" PRIMARY KEY ("orderId");

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "customer_order" ADD CONSTRAINT "customer_order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
