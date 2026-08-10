-- Seed the shared guest sentinel user. Fixed, well-known id so app code can
-- point every guest checkout at the same row instead of a NULL userId.
-- Safe to re-run: ON CONFLICT DO NOTHING.
INSERT INTO "User" (
  "id", "role", "firstName", "lastName", "phone", "dateOfBirth", "password",
  "isDobConfirmed", "isVerified", "createdAt", "updatedAt"
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'CUSTOMER',
  'Guest',
  'Checkout',
  'GUEST-SENTINEL-00000000',
  '1970-01-01T00:00:00Z',
  'GUEST_SENTINEL_NO_LOGIN',
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

-- Point any pre-existing guest orders (NULL userId) at the sentinel, so the
-- next migration can safely make orders.userId NOT NULL.
UPDATE "orders" SET "userId" = '00000000-0000-0000-0000-000000000001'
WHERE "userId" IS NULL;

-- Backfill customer_order for orders that already belong to a real customer.
-- The sentinel is excluded on purpose: every guest shares one id, so linking
-- them here would incorrectly group all guest orders under one "customer".
INSERT INTO "customer_order" ("customerId", "orderId")
SELECT o."userId", o."id"
FROM "orders" o
WHERE o."userId" IS NOT NULL
  AND o."userId" <> '00000000-0000-0000-0000-000000000001'
ON CONFLICT ("orderId") DO NOTHING;
