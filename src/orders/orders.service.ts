import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  OrderStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

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
  async createOrder(
    userId: string | null,
    createOrderDto: CreateOrderDto,
  ) {
    const {
      storeId,
      items,
      type,
    } = createOrderDto;

    return this.prisma.$transaction(
      async (tx) => {
        // --------------------------------------------------
        // 1. Validate Store
        // --------------------------------------------------

        const store =
          await tx.store.findUnique({
            where: {
              id: storeId,
            },
            select: {
              id: true,
              isActive: true,
            },
          });

        if (!store) {
          throw new NotFoundException(
            'Store not found',
          );
        }

        if (!store.isActive) {
          throw new BadRequestException(
            'Cannot place an order for an inactive store',
          );
        }

        // --------------------------------------------------
        // 2. Validate Duplicate Menu Items
        // --------------------------------------------------

        const menuItemIds =
          items.map(
            (item) => item.menuItemId,
          );

        const uniqueMenuItemIds =
          new Set(menuItemIds);

        if (
          uniqueMenuItemIds.size !==
          menuItemIds.length
        ) {
          throw new BadRequestException(
            'Duplicate menu items are not allowed',
          );
        }

        // --------------------------------------------------
        // 3. Retrieve Current Menu Items
        // --------------------------------------------------

        const menuItems =
          await tx.menuItem.findMany({
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

        if (
          menuItems.length !==
          menuItemIds.length
        ) {
          const foundIds =
            new Set(
              menuItems.map(
                (item) => item.id,
              ),
            );

          const invalidIds =
            menuItemIds.filter(
              (id) =>
                !foundIds.has(id),
            );

          throw new BadRequestException(
            `Invalid or inactive menu items: ${invalidIds.join(', ')}`,
          );
        }

        // --------------------------------------------------
        // 5. Build Order Items
        //    Using current DB prices
        // --------------------------------------------------

        const menuItemsMap =
          new Map(
            menuItems.map(
              (item) => [
                item.id,
                item,
              ],
            ),
          );

        let subtotal = 0;

        const orderItems =
          items.map((item) => {
            const menuItem =
              menuItemsMap.get(
                item.menuItemId,
              );

            if (!menuItem) {
              throw new BadRequestException(
                `Menu item ${item.menuItemId} not found`,
              );
            }

            const unitPrice =
              Number(
                menuItem.price,
              );

            const totalPrice =
              unitPrice *
              item.quantity;

            total += totalPrice;

            return {
              menuItemId:
                menuItem.id,

              // Historical snapshot
              itemName:
                menuItem.name,

              quantity:
                item.quantity,

              unitPrice:
                menuItem.price,

              totalPrice,
            };
          });



        // --------------------------------------------------
        // 7. Calculate Final Total
        // --------------------------------------------------

        let total = 0;

        // --------------------------------------------------
        // 8. Create Order as PENDING
        // --------------------------------------------------
        // This state is temporary and exists only
        // during the transaction.

        const order =
          await tx.order.create({
            data: {
              userId,
              storeId,

              status:
                OrderStatus.PENDING,

              type,
              total,

              items: {
                create:
                  orderItems,
              },
            },
          });

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

        const confirmedOrder =
          await tx.order.update({
            where: {
              id: order.id,
            },
            data: {
              status:
                OrderStatus.CONFIRMED,
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
      },
    );
  }

  /**
   * Get the authenticated user's order history.
   */
  async getMyOrders(
    userId: string,
  ) {
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
  async getOrderById(
    orderId: string,
    userId: string,
  ) {
    const order =
      await this.prisma.order.findFirst({
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
      throw new NotFoundException(
        'Order not found',
      );
    }

    return order;
  }

  /**
   * Get today's orders for the cashier's assigned store.
   */
  async getCashierOrders(
    cashierId: string,
  ) {
    // --------------------------------------------------
    // 1. Get Cashier Store Assignment
    // --------------------------------------------------

    const storeCashier =
      await this.prisma.storeCashier.findUnique({
        where: {
          cashierId,
        },

        select: {
          storeId: true,
        },
      });

    if (!storeCashier) {
      throw new NotFoundException(
        'Cashier is not assigned to a store',
      );
    }

    // --------------------------------------------------
    // 2. Calculate Today's Date Range
    // --------------------------------------------------

    const now =
      new Date();

    const startOfDay =
      new Date(now);

    startOfDay.setHours(
      0,
      0,
      0,
      0,
    );

    const endOfDay =
      new Date(now);

    endOfDay.setHours(
      23,
      59,
      59,
      999,
    );

    // --------------------------------------------------
    // 3. Get Today's Store Orders
    // --------------------------------------------------

    return this.prisma.order.findMany({
      where: {
        storeId:
          storeCashier.storeId,

        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        items: true,

        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
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

    const storeCashier =
      await this.prisma.storeCashier.findUnique({
        where: {
          cashierId,
        },

        select: {
          storeId: true,
        },
      });

    if (!storeCashier) {
      throw new NotFoundException(
        'Cashier is not assigned to a store',
      );
    }

    // --------------------------------------------------
    // 2. Find Order in Cashier's Store
    // --------------------------------------------------

    const order =
      await this.prisma.order.findFirst({
        where: {
          id: orderId,

          storeId:
            storeCashier.storeId,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    // --------------------------------------------------
    // 3. Validate Status Transition
    // --------------------------------------------------

    const allowedTransitions:
      Record<
        OrderStatus,
        OrderStatus[]
      > = {
      [OrderStatus.PENDING]: [],

      [OrderStatus.CONFIRMED]: [
        OrderStatus.IN_PROGRESS,
      ],

      [OrderStatus.IN_PROGRESS]: [
        OrderStatus.FINISHED,
      ],

      [OrderStatus.FINISHED]: [],
    };

    const isAllowed =
      allowedTransitions[
        order.status
      ].includes(
        dto.status,
      );

    if (!isAllowed) {
      throw new BadRequestException(
        `Cannot change order status from ${order.status} to ${dto.status}`,
      );
    }

    // --------------------------------------------------
    // 4. Update Status
    // --------------------------------------------------

    return this.prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        status:
          dto.status,
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
  }
}