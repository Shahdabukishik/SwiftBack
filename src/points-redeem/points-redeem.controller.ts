import { Body, Controller, Post, Req, UseGuards , Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { RedeemPointsService } from './points-redeem.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';

@ApiTags('Points Redeem')
@ApiBearerAuth()
@Controller('points/redeem')
export class PointsRedeemController {
  constructor(private readonly redeemPointsService: RedeemPointsService) {}

  @Version('1')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Post('users')
  @Roles(UserRole.ADMIN,UserRole.CASHIER)
  @ApiOperation({ summary: 'Redeem points for one or more rewards', description: 'Redeems multiple rewards in a single transaction using the authenticated user as the creator.' })
  @ApiResponse({ status: 201, description: 'Redeem completed successfully', schema: { example: {
    transaction: {
      id: 'a3f14f4e-2c4d-44a2-873a-12d469833084',
      type: 'redeem',
      points: -250,
      balanceAfter: 50,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    redeemedItems: [{
      rewardId: '3f8d3b2a-6f1a-4b63-8b2a-6a7b5d11f2d',
      quantity: 2,
      pointsPerItem: 100,
      totalPoints: 200,
      menuItem: {
        id: 1,
        name: 'Coffee',
        description: 'Hot coffee',
        images: [],
      },
    }],
    balance: { currentBalance: 50 },
  } } })
  async redeem(@Body() dto: RedeemPointsDto, @Req() req: { user: { sub?: string; userId?: string } }) {
    return this.redeemPointsService.redeem(dto, req.user.sub ?? req.user.userId ?? 'system');
  }
}
