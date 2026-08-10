// Shared placeholder user row every guest checkout points at, instead of a
// NULL userId. Seeded once in migration 20260805111149_backfill_guest_user_data.
export const GUEST_USER_ID = '00000000-0000-0000-0000-000000000001';

// TODO: fixed for now — revisit once delivery fees become per-store or
// distance-based.
export const DELIVERY_FEE = 15;
