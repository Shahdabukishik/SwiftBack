-- AlterTable: add as nullable first, existing orders have no phone on file yet.
ALTER TABLE "orders" ADD COLUMN "phone" TEXT;

-- Backfill: use the phone already on file for the order's own user (covers
-- both real customers and the guest sentinel, which also has a phone value).
UPDATE "orders" o
SET "phone" = u."phone"
FROM "User" u
WHERE u."id" = o."userId"
  AND o."phone" IS NULL;

-- Now safe to require it going forward.
ALTER TABLE "orders" ALTER COLUMN "phone" SET NOT NULL;
