-- AlterEnum
ALTER TYPE "OrderType" ADD VALUE 'IN_STORE';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "customer_order" (
    "customerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_order_pkey" PRIMARY KEY ("customerId","orderId")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_order_orderId_key" ON "customer_order"("orderId");

-- CreateIndex
CREATE INDEX "customer_order_customerId_idx" ON "customer_order"("customerId");

-- AddForeignKey
ALTER TABLE "customer_order" ADD CONSTRAINT "customer_order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_order" ADD CONSTRAINT "customer_order_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
