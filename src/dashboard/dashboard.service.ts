import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const customers = await this.prisma.user.count({ where: { role: 'CUSTOMER' } });

    const [issuedAgg, redeemedAgg] = await Promise.all([
      this.prisma.pointsTransaction.aggregate({
        _sum: { points: true },
        where: { points: { gt: 0 } },
      }),
      this.prisma.pointsTransaction.aggregate({
        _sum: { points: true },
        where: { type: 'redeem' },
      }),
    ]);

    const issuedPoints = Number(issuedAgg._sum.points ?? 0);
    const redeemedPoints = Math.abs(Number(redeemedAgg._sum.points ?? 0));
    const redemptionRate = issuedPoints > 0 ? (redeemedPoints / issuedPoints) * 100 : 0;

    const stores = await this.prisma.store.findMany({
      select: { id: true, name: true },
    });

    // Store count is small (a handful of branches), so a query per store is fine.
    const branches = await Promise.all(stores.map((store) => this.getBranchStats(store)));

    const loyaltyLevels = await this.getLoyaltyLevels(customers);

    return {
      customers,
      issuedPoints,
      redeemedPoints,
      redemptionRate,
      branches,
      loyaltyLevels,
    };
  }

  private async getBranchStats(store: { id: string; name: string }) {
    const [issuedAgg, redeemedAgg, customerTransactions] = await Promise.all([
      this.prisma.pointsTransaction.aggregate({
        _sum: { points: true },
        where: { storeId: store.id, points: { gt: 0 } },
      }),
      this.prisma.pointsTransaction.aggregate({
        _sum: { points: true },
        where: { storeId: store.id, type: 'redeem' },
      }),
      // Transactions with no storeId (no cashier attribution) are excluded
      // entirely rather than shown as "unassigned".
      this.prisma.pointsTransaction.findMany({
        where: { storeId: store.id, user: { role: 'CUSTOMER' } },
        distinct: ['userId'],
        select: { userId: true },
      }),
    ]);

    const issuedPoints = Number(issuedAgg._sum.points ?? 0);
    const redeemedPoints = Math.abs(Number(redeemedAgg._sum.points ?? 0));
    const redemptionRate = issuedPoints > 0 ? (redeemedPoints / issuedPoints) * 100 : 0;

    const customerIds = customerTransactions.map((t) => t.userId);

    const states = customerIds.length
      ? await this.prisma.pointsUserState.findMany({
          where: { userId: { in: customerIds } },
          select: { currentBalance: true },
        })
      : [];

    const totalPoints = states.reduce((sum, state) => sum + Number(state.currentBalance), 0);

    return {
      id: store.id,
      name: store.name,
      customerCount: customerIds.length,
      totalPoints,
      redemptionRate,
    };
  }

  private async getLoyaltyLevels(totalCustomers: number) {
    const levels = await this.prisma.pointsLevel.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const grouped = await this.prisma.pointsUserState.groupBy({
      by: ['currentLevelId'],
      _count: true,
      where: { currentLevelId: { not: null } },
    });

    const countByLevel = new Map(grouped.map((group) => [group.currentLevelId, group._count]));

    return levels.map((level) => {
      const customerCount = countByLevel.get(level.id) ?? 0;
      return {
        id: level.id,
        name: level.name,
        customerCount,
        percentage: totalCustomers > 0 ? (customerCount / totalCustomers) * 100 : 0,
      };
    });
  }
}
