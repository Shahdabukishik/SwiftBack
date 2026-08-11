import { Injectable, NotFoundException , ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GetPointsTransactionsDto } from './dot/get-points-transactions.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class PointsTransactionsService {
  constructor(private readonly prisma: PrismaService) { }

  async getUserHistory(userId: string, dto: GetPointsTransactionsDto, checkUserExists = false) {
    if (checkUserExists) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!userExists) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
    }

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.PointsTransactionWhereInput = {
      userId,
      ...(dto.type && { type: dto.type }),
    };

    const [total, transactions] = await Promise.all([
      this.prisma.pointsTransaction.count({ where: whereClause }),
      this.prisma.pointsTransaction.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          points: true,
          balanceAfter: true,
          createdAt: true,
          createdBy: true,
        },
      }),
    ]);

    return {
      data: transactions.map((transaction) => ({
        ...transaction,
        points: Number(transaction.points),
        balanceAfter: Number(transaction.balanceAfter),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionDetails(id: string,
    currentUser: {
      userId: string;
      role: UserRole;
    },) {
    const transaction = await this.prisma.pointsTransaction.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        points: true,
        balanceAfter: true,
        createdAt: true,
        createdBy: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        redeemItems: {
          select: {
            rewardId: true,
            quantity: true,
            pointsPerItem: true,
            totalPoints: true,
            itemName: true,
            reward: {
              select: {
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
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    const isAdminOrCashier =
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.CASHIER;

    if (
      !isAdminOrCashier &&
      transaction.user.id !== currentUser.userId
    ) {
      throw new ForbiddenException(
        'You are not allowed to access this transaction',
      );
    }
    return {
      ...transaction,
      points: Number(transaction.points),
      balanceAfter: Number(transaction.balanceAfter),
      redeemItems: transaction.redeemItems.map((item) => ({
        rewardId: item.rewardId,
        quantity: item.quantity,
        pointsPerItem: Number(item.pointsPerItem),
        totalPoints: Number(item.totalPoints),
        menuItem: {
          id: item.reward?.menuItem.id ?? null,
          name: item.itemName,
          description: item.reward?.menuItem.description ?? null,
          images: item.reward?.menuItem.images ?? [],
        },
      })),
    };
  }
}