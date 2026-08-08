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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { OrdersService } from './orders.service';
import { UserRole } from '../users/enums/user-role.enum';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateInStoreOrderDto } from './dto/create-in-store-order.dto';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { AdminUpdateOrderDto } from './dto/admin-update-order.dto';

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
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyOrders(@Req() req: any) {
    return this.ordersService.getMyOrders(req.user.userId);
  }

  /**
   * Get today's orders
   * for cashier's assigned store.
   *
   * GET /cashier/orders
   *
   * Registered before GET ':id' on purpose: ':id' is a catch-all path
   * segment, so if it came first it would swallow this literal route
   * (a request to /orders/today would be treated as id="today").
   */
  @Version('1')
  @Get('/today')
  @ApiOperation({ summary: 'Get today orders for cashier' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CASHIER, UserRole.ADMIN)
  async getCashierOrders(@Req() req: any) {
    return this.ordersService.getCashierOrders(req.user.userId);
  }

  /**
   * List every order in the system (admin only), paginated.
   *
   * GET /orders/admin
   *
   * Registered before GET ':id' — same catch-all reasoning as /today.
   */
  @Version('1')
  @Get('/admin')
  @ApiOperation({ summary: 'List all orders (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminFindAll(
    @Query()
    query: AdminOrdersQueryDto,
  ) {
    return this.ordersService.adminFindAll(query);
  }

  /**
   * Get any single order (admin only, no ownership check).
   *
   * GET /orders/admin/:id
   */
  @Version('1')
  @Get('/admin/:id')
  @ApiOperation({ summary: 'Get any order (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminFindOne(
    @Param('id')
    orderId: string,
  ) {
    return this.ordersService.adminFindOne(orderId);
  }

  /**
   * Edit an order's status, note, or total (admin only).
   *
   * PATCH /orders/admin/:id
   */
  @Version('1')
  @Patch('/admin/:id')
  @ApiOperation({ summary: 'Edit an order (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminUpdate(
    @Param('id')
    orderId: string,
    @Body()
    dto: AdminUpdateOrderDto,
  ) {
    return this.ordersService.adminUpdate(orderId, dto);
  }

  /**
   * Delete an order (admin only).
   *
   * DELETE /orders/admin/:id
   */
  @Version('1')
  @Delete('/admin/:id')
  @ApiOperation({ summary: 'Delete an order (admin)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminDelete(
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

  /**
   * Update order status.
   *
   * Allowed:
   *
   * CONFIRMED -> IN_PROGRESS
   * IN_PROGRESS -> FINISHED
   *
   * PATCH /cashier/orders/:id/status
   */
  @Version('1')
  @ApiOperation({ summary: 'Update order status' })
  @Patch('/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CASHIER)
  async updateOrderStatus(
    @Req() req: any,
    @Param('id')
    orderId: string,
    @Body()
    dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(orderId, req.user.userId, dto);
  }
}
