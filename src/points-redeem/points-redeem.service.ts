import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PointsEngineService } from '../points-engine/points-engine.service';

export interface RedeemPointsPayload {
  userId: string;
  items: Array<{ rewardId: string; quantity: number }>;
}

@Injectable()
export class RedeemPointsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsEngineService: PointsEngineService,
  ) {}

  async redeem(dto: RedeemPointsPayload, createdBy: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('items must contain at least one item');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const rewardIds = dto.items.map((item) => item.rewardId);
    const rewards = await this.prisma.pointsReward.findMany({
      where: { id: { in: rewardIds } },
      select: {
        id: true,
        pointsRequired: true,
        menuItem: {
          select: {
            id: true,
            name: true,
            description: true,
            images: {
              select: { id: true, url: true },
            },
          },
        },
      },
    });

    if (rewards.length !== rewardIds.length) {
      throw new BadRequestException('one or more rewards were not found');
    }

    const rewardMap = new Map(rewards.map((reward) => [reward.id, reward]));
    const redeemItems: Array<{ rewardId: string; quantity: number; pointsPerItem: Prisma.Decimal }> = [];
    let requiredPoints = 0;

    for (const item of dto.items) {
      if (!item.rewardId || item.rewardId.trim() === '') {
        throw new BadRequestException('rewardId is required');
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new BadRequestException('quantity must be at least 1');
      }

      const reward = rewardMap.get(item.rewardId);
      if (!reward) {
        throw new BadRequestException(`reward not found: ${item.rewardId}`);
      }

      const pointsPerItem = this.toDecimal(reward.pointsRequired);
      const totalPoints = this.toDecimal(Number(pointsPerItem) * item.quantity);
      requiredPoints += Number(totalPoints);
      redeemItems.push({
        rewardId: item.rewardId,
        quantity: item.quantity,
        pointsPerItem,
      });
    }

    const state = await this.prisma.pointsUserState.findUnique({
      where: { userId: dto.userId },
      select: { currentBalance: true },
    });

    const currentBalance = this.toDecimal(state?.currentBalance ?? 0);
    if (Number(currentBalance) < requiredPoints) {
      throw new BadRequestException('insufficient points balance');
    }

    const result = await this.pointsEngineService.redeemReward({
      userId: dto.userId,
      createdBy,
      requiredPoints,
      redeemItems,
    });

    return {
      transaction: {
        id: result.transaction.id,
        type: result.transaction.type,
        points: result.transaction.points,
        balanceAfter: result.transaction.balanceAfter,
        createdAt: result.transaction.createdAt,
      },
      redeemedItems: redeemItems.map((item) => {
        const reward = rewardMap.get(item.rewardId)!;
        return {
          rewardId: item.rewardId,
          quantity: item.quantity,
          pointsPerItem: item.pointsPerItem,
          totalPoints: this.toDecimal(Number(item.pointsPerItem) * item.quantity),
          menuItem: {
            id: reward.menuItem.id,
            name: reward.menuItem.name,
            description: reward.menuItem.description,
            images: reward.menuItem.images,
          },
        };
      }),
      balance: {
        currentBalance: result.state.currentBalance,
      },
    };
  }

  private toDecimal(value: number | Prisma.Decimal | null | undefined): Prisma.Decimal {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return new Prisma.Decimal(0);
    }

    if (value instanceof Prisma.Decimal) {
      return value;
    }

    return new Prisma.Decimal(value);
  }
}
