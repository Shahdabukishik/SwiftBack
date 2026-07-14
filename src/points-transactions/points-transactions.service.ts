import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GetPointsTransactionsDto } from './dot/get-points-transactions.dto';

@Injectable()
export class PointsTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async getTransactionDetails(id: string) {
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
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return {
      ...transaction,
      points: Number(transaction.points),
      balanceAfter: Number(transaction.balanceAfter),
    };
  }
}