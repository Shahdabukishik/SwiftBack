import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';


import {ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { OrdersService } from './orders.service';
import {UserRole } from '../users/enums/user-role.enum';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

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
    const userId =
      req.user?.userId ?? null;

    return this.ordersService.createOrder(
      userId,
      createOrderDto,
    );
  }

  /**
   * Get authenticated user's
   * order history.
   *
   * GET /orders/my
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyOrders(
    @Req() req: any,
  ) {
    return this.ordersService.getMyOrders(
      req.user.userId,
    );
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
    return this.ordersService.getOrderById(
      orderId,
      req.user.userId,
    );
  }

  /**
   * Get today's orders
   * for cashier's assigned store.
   *
   * GET /cashier/orders
   */
  @Version('1')
  @Get('/today')
  @ApiOperation({ summary: 'Get today orders for cashier' })
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(UserRole.CASHIER,UserRole.ADMIN)
  async getCashierOrders(
    @Req() req: any,
  ) {
    return this.ordersService.getCashierOrders(
      req.user.userId,
    );
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
  @Patch(
    '/:id/status',
  )
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(UserRole.CASHIER)
  async updateOrderStatus(
    @Req() req: any,
    @Param('id')
    orderId: string,
    @Body()
    dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      orderId,
      req.user.userId,
      dto,
    );
  }
}