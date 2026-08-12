import { OrderType } from '@prisma/client';

// TODO: fixed for now — revisit once delivery fees become per-store or
// distance-based.
export const DELIVERY_FEE = 15;

// Contact phone for an in-store order when the cashier's customer lookup
// was a QR scan (a user id) that matched no one — there's no real phone to
// fall back on, unlike a typed-phone lookup miss, where we keep what was
// typed as the contact phone instead.
export const UNKNOWN_CUSTOMER_PHONE = 'Unknown';

// Customers/guests can only self-serve PICKUP or DELIVERY, and it's the
// only pair a cashier/admin can switch an order between after the fact.
// IN_STORE orders are entered by a cashier through a separate endpoint
// and aren't a valid target for this switch.
export const CUSTOMER_ORDER_TYPES = [
  OrderType.PICKUP,
  OrderType.DELIVERY,
] as const;
