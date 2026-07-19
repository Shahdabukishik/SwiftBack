-- CreateTable
CREATE TABLE "points_redeem_items" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "reward_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "points_per_item" DECIMAL(10,2) NOT NULL,
    "total_points" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "points_redeem_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "points_redeem_items" ADD CONSTRAINT "points_redeem_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "points_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_redeem_items" ADD CONSTRAINT "points_redeem_items_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "points_rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
