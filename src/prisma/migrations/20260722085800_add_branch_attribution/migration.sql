-- AlterTable
ALTER TABLE "points_transactions" ADD COLUMN     "cashier_name" VARCHAR(150),
ADD COLUMN     "store_id" TEXT,
ADD COLUMN     "store_name" VARCHAR(150);

-- CreateTable
CREATE TABLE "store_cashiers" (
    "id" TEXT NOT NULL,
    "cashier_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,

    CONSTRAINT "store_cashiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_cashiers_cashier_id_key" ON "store_cashiers"("cashier_id");

-- CreateIndex
CREATE INDEX "store_cashiers_store_id_idx" ON "store_cashiers"("store_id");

-- CreateIndex
CREATE INDEX "points_transactions_store_id_idx" ON "points_transactions"("store_id");

-- AddForeignKey
ALTER TABLE "store_cashiers" ADD CONSTRAINT "store_cashiers_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_cashiers" ADD CONSTRAINT "store_cashiers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
