-- DropForeignKey
ALTER TABLE "points_redeem_items" DROP CONSTRAINT "points_redeem_items_reward_id_fkey";

-- AlterTable
ALTER TABLE "points_redeem_items" ALTER COLUMN "reward_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "points_redeem_items" ADD CONSTRAINT "points_redeem_items_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "points_rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
