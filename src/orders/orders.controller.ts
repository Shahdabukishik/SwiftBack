import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { OrdersService } from './orders.service';
import { UserRole } from '../users/enums/user-role.enum';

import { CreateOrderDto } from './dto/create-order.dto';
import { CreateInStoreOrderDto } from './dto/create-in-store-order.dto';
import { OrdersQueryDto } from './dto/orders-query.dto';
import { OrderUpdateDto } from './dto/order-update.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Create Order
   *
   * Supports:
   * - Authenticated User
   * - Guest
   *
   * Guest:
   * userId = null
   */
  @Version('1')
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async createOrder(
    @Req() req: any,
    @Body()
    createOrderDto: CreateOrderDto,
  ) {
    const userId = req.user?.userId ?? null;

    return this.ordersService.createOrder(userId, createOrderDto);
  }

  /**
   * Get authenticated user's
   * order history.
   *
   * GET /orders/my
   */
  @Version('1')
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyOrders(@Req() req: any) {
    return this.ordersService.getMyOrders(req.user.userId);
  }

  /**
   * List orders, paginated and optionally filtered by status/type/store.
   *
   * - ADMIN: sees every store, no date restriction.
   * - CASHIER: always scoped to their own assigned store, capped to the
   *   last 3 days — any storeId they pass is ignored.
   *
   * GET /orders
   *
   * Registered before GET ':id' on purpose: ':id' is a catch-all path
   * segment, so if it came first it would swallow this literal route.
   * (A base-path GET has no extra segment though, so this is actually
   * safe either way — kept here for readability alongside the other
   * literal routes.)
   */
  @Version('1')
  @Get()
  @ApiOperation({ summary: 'List orders (cashier: own store; admin: all)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CASHIER, UserRole.ADMIN)
  async findOrders(
    @Req() req: any,
    @Query()
    query: OrdersQueryDto,
  ) {
    return this.ordersService.findOrders(
      { userId: req.user.userId, role: req.user.role },
      query,
    );
  }

  /**
   * Get any single order, no customer-ownership check.
   *
   * - ADMIN: any order.
   * - CASHIER: only orders placed at their own assigned store.
   *
   * GET /orders/manage/:id
   */
  @Version('1')
  @Get('/manage/:id')
  @ApiOperation({
    summary: 'Get any order (admin: any store; cashier: own store)',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  async findOrder(
    @Req() req: any,
    @Param('id')
    orderId: string,
  ) {
    return this.ordersService.findOrder(
      { userId: req.user.userId, role: req.user.role },
      orderId,
    );
  }

  /**
   * Edit an order — including changing its status (e.g. to advance it or
   * to cancel it) or switching it between PICKUP and DELIVERY.
   *
   * - ADMIN: status/note/total/address/phone/type/items, no restrictions.
   * - CASHIER: note/address/phone/type/items/status (no total), own
   *   store only, status unrestricted like admin — but since edits are
   *   blocked once the order is already FINISHED or CANCELLED, a
   *   cashier can only cancel from PENDING, CONFIRMED, or IN_PROGRESS.
   *
   * Switching `type` to DELIVERY requires an address (sent alongside, or
   * already on the order); switching to PICKUP clears any address. Both
   * directions recalculate deliveryFee and total automatically.
   *
   * PATCH /orders/manage/:id
   */
  @Version('1')
  @Patch('/manage/:id')
  @ApiOperation({
    summary:
      'Edit an order, incl. status (admin: unrestricted; cashier: own store, no total)',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  async updateOrder(
    @Req() req: any,
    @Param('id')
    orderId: string,
    @Body()
    dto: OrderUpdateDto,
  ) {
    return this.ordersService.updateOrder(
      { userId: req.user.userId, role: req.user.role },
      orderId,
      dto,
    );
  }

  /**
   * Delete an order (admin only).
   *
   * DELETE /orders/manage/:id
   */
  @Version('1')
  @Delete('/manage/:id')
  @ApiOperation({ summary: 'Delete an order (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteOrder(
    @Param('id')
    orderId: string,
  ) {
    return this.ordersService.adminDelete(orderId);
  }

  /**
   * Get authenticated user's
   * specific order.
   *
   * GET /orders/:id
   */
  @Version('1')
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrderById(
    @Req() req: any,
    @Param('id')
    orderId: string,
  ) {
    return this.ordersService.getOrderById(orderId, req.user.userId);
  }

  /**
   * Cancel own order while it's still CONFIRMED.
   *
   * PATCH /orders/:id/cancel
   */
  @Version('1')
  @Patch('/:id/cancel')
  @ApiOperation({ summary: 'Cancel own order' })
  @UseGuards(JwtAuthGuard)
  async cancelOrder(
    @Req() req: any,
    @Param('id')
    orderId: string,
  ) {
    return this.ordersService.cancelOrder(orderId, req.user.userId);
  }

  /**
   * Claim a guest order after registering/logging in.
   *
   * POST /orders/:id/claim
   */
  @Version('1')
  @Post('/:id/claim')
  @ApiOperation({ summary: 'Claim a guest order' })
  @UseGuards(JwtAuthGuard)
  async claimOrder(
    @Req() req: any,
    @Param('id')
    orderId: string,
  ) {
    return this.ordersService.claimOrder(orderId, req.user.userId);
  }

  /**
   * Record an in-store purchase (cashier at the counter).
   *
   * POST /orders/in-store
   */
  @Version('1')
  @Post('/in-store')
  @ApiOperation({ summary: 'Record an in-store purchase' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CASHIER)
  async createInStoreOrder(
    @Req() req: any,
    @Body()
    dto: CreateInStoreOrderDto,
  ) {
    return this.ordersService.createInStoreOrder(req.user.userId, dto);
  }
}
