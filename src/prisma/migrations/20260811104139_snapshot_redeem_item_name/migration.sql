-- AlterTable
ALTER TABLE "points_redeem_items" ADD COLUMN "item_name" VARCHAR(150);

-- Backfill from the still-linked reward's menu item where possible.
UPDATE "points_redeem_items" pri
SET "item_name" = mi."name"
FROM "points_rewards" pr
JOIN "menu_items" mi ON mi."id" = pr."menu_item_id"
WHERE pri."reward_id" = pr."id";

-- Rows whose reward was already deleted (rewardId is null) have no source
-- to backfill the name from.
UPDATE "points_redeem_items"
SET "item_name" = 'Deleted item'
WHERE "item_name" IS NULL;

-- AlterTable
ALTER TABLE "points_redeem_items" ALTER COLUMN "item_name" SET NOT NULL;
