import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { OrderStatus, OrderType, Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';

import { PrismaService } from '../prisma/prisma.service';
import { PointsEngineService } from '../points-engine/points-engine.service';
import { UserRole } from '../users/enums/user-role.enum';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateInStoreOrderDto } from './dto/create-in-store-order.dto';
import { OrdersQueryDto } from './dto/orders-query.dto';
import { AdminUpdateOrderDto } from './dto/admin-update-order.dto';
import { DELIVERY_FEE, GUEST_USER_ID } from './orders.constants';

// How far back a cashier can see their own store's order history.
const CASHIER_HISTORY_DAYS = 3;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsEngineService: PointsEngineService,
  ) {}

  /**
   * Create a new order for a registered user or guest.
   *
   * The order is initially created with PENDING status
   * inside the transaction.
   *
   * After all validations, calculations, and OrderItems
   * creation succeed, the order status is changed to
   * CONFIRMED before the transaction is committed.
   *
   * Therefore, external queries will only see the order
   * after a successful commit, with CONFIRMED status.
   */
  async createOrder(userId: string | null, createOrderDto: CreateOrderDto) {
    const { storeId, items, type, phone, address } = createOrderDto;

    // Guests share one fixed placeholder user row instead of a NULL userId.
    const resolvedUserId = userId ?? GUEST_USER_ID;

    return this.prisma.$transaction(async (tx) => {
      // --------------------------------------------------
      // 1. Validate Store
      // --------------------------------------------------

      const store = await tx.store.findUnique({
        where: {
          id: storeId,
        },
        select: {
          id: true,
          isActive: true,
        },
      });

      if (!store) {
        throw new NotFoundException('Store not found');
      }

      if (!store.isActive) {
        throw new BadRequestException(
          'Cannot place an order for an inactive store',
        );
      }

      // --------------------------------------------------
      // 2. Validate Duplicate Menu Items
      // --------------------------------------------------

      const menuItemIds = items.map((item) => item.menuItemId);

      const uniqueMenuItemIds = new Set(menuItemIds);

      if (uniqueMenuItemIds.size !== menuItemIds.length) {
        throw new BadRequestException('Duplicate menu items are not allowed');
      }

      // --------------------------------------------------
      // 3. Retrieve Current Menu Items
      // --------------------------------------------------

      const menuItems = await tx.menuItem.findMany({
        where: {
          id: {
            in: menuItemIds,
          },
          active: true,
        },
        select: {
          id: true,
          name: true,
          price: true,
        },
      });

      // --------------------------------------------------
      // 4. Validate All Menu Items
      // --------------------------------------------------

      if (menuItems.length !== menuItemIds.length) {
        const foundIds = new Set(menuItems.map((item) => item.id));

        const invalidIds = menuItemIds.filter((id) => !foundIds.has(id));

        throw new BadRequestException(
          `Invalid or inactive menu items: ${invalidIds.join(', ')}`,
        );
      }

      // --------------------------------------------------
      // 5. Build Order Items
      //    Using current DB prices
      // --------------------------------------------------

      const menuItemsMap = new Map(menuItems.map((item) => [item.id, item]));

      let itemsTotal = 0;

      const orderItems = items.map((item) => {
        const menuItem = menuItemsMap.get(item.menuItemId);

        if (!menuItem) {
          throw new BadRequestException(
            `Menu item ${item.menuItemId} not found`,
          );
        }

        const unitPrice = Number(menuItem.price);

        const totalPrice = unitPrice * item.quantity;

        itemsTotal += totalPrice;

        return {
          menuItemId: menuItem.id,

          // Historical snapshot
          itemName: menuItem.name,

          quantity: item.quantity,

          unitPrice: menuItem.price,

          totalPrice,

          note: item.note ?? null,
        };
      });

      // --------------------------------------------------
      // 8. Create Order as PENDING
      // --------------------------------------------------
      // This state is temporary and exists only
      // during the transaction.

      const deliveryFee = type === OrderType.DELIVERY ? DELIVERY_FEE : 0;

      const order = await tx.order.create({
        data: {
          userId: resolvedUserId,
          storeId,

          status: OrderStatus.PENDING,

          type,
          total: itemsTotal + deliveryFee,
          deliveryFee,
          phone,
          ...(type === OrderType.DELIVERY ? { address } : {}),

          items: {
            create: orderItems,
          },
        },
      });

      // --------------------------------------------------
      // 8b. Link Real Customers
      // --------------------------------------------------
      // Guests (resolvedUserId === GUEST_USER_ID) are excluded on
      // purpose: every guest shares one id, so linking them here
      // would incorrectly group all guest orders under one "customer".

      if (resolvedUserId !== GUEST_USER_ID) {
        await tx.customerOrder.create({
          data: {
            customerId: resolvedUserId,
            orderId: order.id,
          },
        });
      }

      // --------------------------------------------------
      // 9. Mark Order as CONFIRMED
      // --------------------------------------------------
      // This happens only after:
      // - Store validation
      // - Menu item validation
      // - Price retrieval
      // - Price calculation
      // - Order creation
      // - OrderItem creation
      //
      // The update happens inside the SAME transaction.

      const confirmedOrder = await tx.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: OrderStatus.CONFIRMED,
        },
        include: {
          items: true,

          store: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });

      // --------------------------------------------------
      // 10. Return Confirmed Order
      // --------------------------------------------------

      return confirmedOrder;
    });
  }

  /**
   * Get the authenticated user's order history.
   */
  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },

        items: {
          select: {
            id: true,
            menuItemId: true,
            itemName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
      },
    });
  }

  /**
   * Get a specific order belonging
   * to the authenticated user.
   */
  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },

      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },

        items: {
          select: {
            id: true,
            menuItemId: true,
            itemName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * List orders, paginated and optionally filtered by status/type/store.
   *
   * - ADMIN: sees every store, no date restriction, storeId filter optional.
   * - CASHIER: always scoped to their own assigned store, and capped to the
   *   last CASHIER_HISTORY_DAYS days — any storeId they pass is ignored.
   */
  async findOrders(
    caller: { userId: string; role: UserRole },
    query: OrdersQueryDto,
  ) {
    const { page, limit, status, type, storeId } = query;

    const skip = (page - 1) * limit;

    let effectiveStoreId = storeId;
    let createdAt: Prisma.OrderWhereInput['createdAt'];

    if (caller.role === UserRole.CASHIER) {
      const storeCashier = await this.prisma.storeCashier.findUnique({
        where: {
          cashierId: caller.userId,
        },

        select: {
          storeId: true,
        },
      });

      if (!storeCashier) {
        throw new NotFoundException('Cashier is not assigned to a store');
      }

      effectiveStoreId = storeCashier.storeId;

      const historyStart = new Date();

      historyStart.setDate(
        historyStart.getDate() - (CASHIER_HISTORY_DAYS - 1),
      );
      historyStart.setHours(0, 0, 0, 0);

      createdAt = { gte: historyStart };
    }

    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(effectiveStoreId ? { storeId: effectiveStoreId } : {}),
      ...(createdAt ? { createdAt } : {}),
    };

    const [orders, totalItems] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          store: {
            select: { id: true, name: true },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
          items: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNextPage: page < Math.ceil(totalItems / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Record an in-store purchase entered by a cashier: a total amount
   * against a customer's account, with no line items — the money
   * already changed hands at the counter, so the order is created
   * straight at FINISHED and points are awarded immediately.
   *
   * The customer is resolved from `customerLookup`, which is either
   * their phone number or their scanned QR value (their user id). If
   * no matching customer is found, the purchase is still recorded —
   * against the shared guest sentinel — but earns no points and isn't
   * linked to anyone.
   */
  async createInStoreOrder(cashierId: string, dto: CreateInStoreOrderDto) {
    const storeCashier = await this.prisma.storeCashier.findUnique({
      where: {
        cashierId,
      },
      select: {
        storeId: true,
      },
    });

    if (!storeCashier) {
      throw new NotFoundException('Cashier is not assigned to a store');
    }

    const customer = await this.prisma.user.findFirst({
      where: {
        role: 'CUSTOMER',
        id: {
          not: GUEST_USER_ID,
        },
        OR: [
          ...(isUUID(dto.customerLookup) ? [{ id: dto.customerLookup }] : []),
          { phone: dto.customerLookup },
        ],
      },
    });

    const guestSentinel = customer
      ? null
      : await this.prisma.user.findUniqueOrThrow({
          where: {
            id: GUEST_USER_ID,
          },
          select: {
            phone: true,
          },
        });

    const resolvedUserId = customer?.id ?? GUEST_USER_ID;

    // If the lookup was a phone number that matched no one, keep what
    // the cashier typed as the order's contact phone. Otherwise (a QR
    // scan that matched no one) there's no real phone to fall back on.
    const phone =
      customer?.phone ??
      (isUUID(dto.customerLookup) ? guestSentinel!.phone : dto.customerLookup);

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: resolvedUserId,
          storeId: storeCashier.storeId,
          status: OrderStatus.FINISHED,
          type: OrderType.IN_STORE,
          total: dto.total,
          phone,
          note: dto.note,
        },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });

      if (customer) {
        await tx.customerOrder.create({
          data: {
            customerId: customer.id,
            orderId: created.id,
          },
        });
      }

      return created;
    });

    await this.awardOrderPoints({
      orderId: order.id,
      userId: order.userId,
      createdBy: cashierId,
      purchaseAmount: Number(order.total),
    });

    return order;
  }

  /**
   * Update order status by cashier.
   *
   * Allowed transitions:
   *
   * CONFIRMED -> IN_PROGRESS
   * IN_PROGRESS -> FINISHED
   *
   * PENDING is not a cashier-managed state.
   * It is only a temporary internal state during
   * order creation.
   */
  async updateOrderStatus(
    orderId: string,
    cashierId: string,
    dto: UpdateOrderStatusDto,
  ) {
    // --------------------------------------------------
    // 1. Get Cashier Store Assignment
    // --------------------------------------------------

    const storeCashier = await this.prisma.storeCashier.findUnique({
      where: {
        cashierId,
      },

      select: {
        storeId: true,
      },
    });

    if (!storeCashier) {
      throw new NotFoundException('Cashier is not assigned to a store');
    }

    // --------------------------------------------------
    // 2. Find Order in Cashier's Store
    // --------------------------------------------------

    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,

        storeId: storeCashier.storeId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // --------------------------------------------------
    // 3. Validate Status Transition
    // --------------------------------------------------

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [],

      [OrderStatus.CONFIRMED]: [OrderStatus.IN_PROGRESS],

      [OrderStatus.IN_PROGRESS]: [OrderStatus.FINISHED],

      [OrderStatus.FINISHED]: [],

      [OrderStatus.CANCELLED]: [],
    };

    const isAllowed = allowedTransitions[order.status].includes(dto.status);

    if (!isAllowed) {
      throw new BadRequestException(
        `Cannot change order status from ${order.status} to ${dto.status}`,
      );
    }

    // --------------------------------------------------
    // 4. Update Status
    // --------------------------------------------------

    const updatedOrder = await this.prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        status: dto.status,
      },

      include: {
        items: true,

        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // --------------------------------------------------
    // 5. Award Loyalty Points
    // --------------------------------------------------
    // Only when the order just became FINISHED, and only for real
    // customers — guest orders earn nothing until claimed.

    if (dto.status === OrderStatus.FINISHED) {
      await this.awardOrderPoints({
        orderId: updatedOrder.id,
        userId: updatedOrder.userId,
        createdBy: cashierId,
        purchaseAmount:
          Number(updatedOrder.total) - Number(updatedOrder.deliveryFee),
      });
    }

    return updatedOrder;
  }

  /**
   * Cancel the authenticated user's own order.
   *
   * Only allowed while the order is still CONFIRMED — once a cashier
   * has started on it (IN_PROGRESS) or it's done, the customer can no
   * longer back out.
   */
  async cancelOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException(
        `Cannot cancel an order with status ${order.status}`,
      );
    }

    return this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: OrderStatus.CANCELLED,
      },
      include: {
        items: true,
        store: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });
  }

  /**
   * Claim a guest order after the guest registers/logs in.
   *
   * Moves the order off the shared guest sentinel onto the real
   * customer's account, links it into customer_order, and — if the
   * order already finished while it was still a guest order — awards
   * the points that were withheld at the time, attributed to the
   * order's own store (there's no cashier involved in a self-service
   * claim).
   */
  async claimOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== GUEST_USER_ID) {
      throw new BadRequestException('This order has already been claimed');
    }

    const claimedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          userId,
        },
        include: {
          items: true,
          store: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });

      await tx.customerOrder.create({
        data: {
          customerId: userId,
          orderId: updated.id,
        },
      });

      return updated;
    });

    if (claimedOrder.status === OrderStatus.FINISHED) {
      await this.awardOrderPoints({
        orderId: claimedOrder.id,
        userId: claimedOrder.userId,
        createdBy: userId,
        purchaseAmount:
          Number(claimedOrder.total) - Number(claimedOrder.deliveryFee),
        storeOverride: {
          storeId: order.store.id,
          storeName: order.store.name,
        },
      });
    }

    return claimedOrder;
  }

  /**
   * Award purchase points for a FINISHED order, unless:
   * - the order still belongs to the guest sentinel (nothing to award to), or
   * - points were already awarded for this order (idempotency guard, keyed
   *   on the order id via PointsTransaction.referenceId).
   *
   * A points-engine failure (e.g. a mis-configured points level) is logged
   * but does not fail the caller — finishing an order or claiming it should
   * not be blocked by the loyalty subsystem.
   */
  private async awardOrderPoints(params: {
    orderId: string;
    userId: string;
    createdBy: string;
    purchaseAmount: number;
    storeOverride?: { storeId: string; storeName: string } | null;
  }) {
    if (params.userId === GUEST_USER_ID) {
      return;
    }

    if (params.purchaseAmount <= 0) {
      return;
    }

    const alreadyAwarded = await this.prisma.pointsTransaction.findFirst({
      where: {
        referenceType: 'PURCHASE',
        referenceId: params.orderId,
      },
      select: { id: true },
    });

    if (alreadyAwarded) {
      return;
    }

    try {
      await this.pointsEngineService.awardPurchasePoints({
        userId: params.userId,
        createdBy: params.createdBy,
        purchaseAmount: params.purchaseAmount,
        referenceId: params.orderId,
        storeOverride: params.storeOverride,
      });
    } catch (error) {
      this.logger.error(
        `Failed to award purchase points for order ${params.orderId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Get any single order (admin only) — no ownership check, unlike
   * getOrderById.
   */
  async adminFindOne(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        store: {
          select: { id: true, name: true, address: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Admin override for status/note/total. Does not run the cashier
   * status-transition rules, but - like the cashier flow and claiming -
   * does award points when the status lands on FINISHED. Does not
   * adjust points already awarded if the total changes.
   */
  async adminUpdate(
    orderId: string,
    dto: AdminUpdateOrderDto,
    adminId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
        ...(dto.total !== undefined ? { total: dto.total } : {}),
      },
      include: {
        items: true,
        store: {
          select: { id: true, name: true },
        },
      },
    });

    if (dto.status === OrderStatus.FINISHED) {
      await this.awardOrderPoints({
        orderId: updatedOrder.id,
        userId: updatedOrder.userId,
        createdBy: adminId,
        purchaseAmount:
          Number(updatedOrder.total) - Number(updatedOrder.deliveryFee),
      });
    }

    return updatedOrder;
  }

  /**
   * Hard delete (admin only). Allowed regardless of status. Any points
   * already awarded for this order are left untouched on the
   * customer's balance — deleting the order does not claw them back.
   * Its items and customer_order link row cascade-delete via the schema.
   */
  async adminDelete(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.prisma.order.delete({ where: { id: orderId } });

    return { id: orderId, deleted: true };
  }
}
