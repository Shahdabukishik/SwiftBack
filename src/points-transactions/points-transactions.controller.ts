import { Controller, Get, Param, Query, Req, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PointsTransactionsService } from './points-transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionType } from '@prisma/client';
import { GetPointsTransactionsDto } from './dot/get-points-transactions.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';

@ApiTags('Points Transactions')
@Controller('points-transactions')
export class PointsTransactionsController {
  constructor(private readonly pointsTransactionsService: PointsTransactionsService) { }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-history')
  @ApiOperation({ summary: "Return the authenticated user's transaction history" })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiResponse({ status: 200, description: 'Successfully retrieved paginated history.' })
  async getMyHistory(@Req() req: any, @Query() dto: GetPointsTransactionsDto) {
    return this.pointsTransactionsService.getUserHistory(req.user.userId, dto, false);
  }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: 'Return transaction history for a specific user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType })
  @ApiResponse({ status: 200, description: 'Successfully retrieved user history.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserHistory(@Param('userId') userId: string, @Query() dto: GetPointsTransactionsDto) {
    return this.pointsTransactionsService.getUserHistory(userId, dto, true);
  }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':pointsTransactionId')
  @ApiOperation({ summary: 'Return specific transaction details' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved transaction details.' })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async getTransactionDetails(
    @Param('pointsTransactionId') id: string,
    @Req() req: any,
  ) {
    return this.pointsTransactionsService.getTransactionDetails(id, {
      userId: req.user.userId,
      role: req.user.role,
    },);
  }
}