import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PointsEngineService } from '../points-engine/points-engine.service';
import { RedeemPointsService } from './points-redeem.service'

describe('RedeemPointsService', () => {
  let service: RedeemPointsService;
  let prisma: any;
  let engine: { redeemReward: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      pointsReward: { findMany: jest.fn() },
      pointsUserState: { findUnique: jest.fn() },
    };

    engine = {
      redeemReward: jest.fn(),
    };

    service = new RedeemPointsService(prisma as any, engine as any);
  });

  it('redeems a single reward and returns the response shape', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    prisma.pointsReward.findMany.mockResolvedValue([
      {
        id: 'reward-1',
        pointsRequired: new Prisma.Decimal('100'),
        menuItem: {
          id: 1,
          name: 'Coffee',
          description: 'Hot coffee',
          images: [{ id: 'img-1', url: 'https://example.com/a.jpg' }],
        },
      },
    ]);
    prisma.pointsUserState.findUnique.mockResolvedValue({
      currentBalance: new Prisma.Decimal('150'),
    });
    engine.redeemReward.mockResolvedValue({
      transaction: {
        id: 'txn-1',
        type: 'redeem',
        points: new Prisma.Decimal('-100'),
        balanceAfter: new Prisma.Decimal('50'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      state: { currentBalance: new Prisma.Decimal('50') },
    });

    const result = await service.redeem({
      userId: 'user-1',
      items: [{ rewardId: 'reward-1', quantity: 1 }],
    }, 'user-1');

    expect(engine.redeemReward).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      createdBy: 'user-1',
      requiredPoints: 100,
      redeemItems: [
        {
          rewardId: 'reward-1',
          quantity: 1,
          pointsPerItem: new Prisma.Decimal('100'),
        },
      ],
    }));
    expect(result.transaction.type).toBe('redeem');
    expect(result.redeemedItems[0].menuItem.name).toBe('Coffee');
  });

  it('redeems multiple rewards in one request', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    prisma.pointsReward.findMany.mockResolvedValue([
      {
        id: 'reward-1',
        pointsRequired: new Prisma.Decimal('100'),
        menuItem: {
          id: 1,
          name: 'Coffee',
          description: 'Hot coffee',
          images: [],
        },
      },
      {
        id: 'reward-2',
        pointsRequired: new Prisma.Decimal('50'),
        menuItem: {
          id: 2,
          name: 'Tea',
          description: 'Green tea',
          images: [],
        },
      },
    ]);
    prisma.pointsUserState.findUnique.mockResolvedValue({
      currentBalance: new Prisma.Decimal('250'),
    });
    engine.redeemReward.mockResolvedValue({
      transaction: {
        id: 'txn-2',
        type: 'redeem',
        points: new Prisma.Decimal('-250'),
        balanceAfter: new Prisma.Decimal('0'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      state: { currentBalance: new Prisma.Decimal('0') },
    });

    await service.redeem({
      userId: 'user-1',
      items: [
        { rewardId: 'reward-1', quantity: 2 },
        { rewardId: 'reward-2', quantity: 1 },
      ],
    }, 'user-1');

    expect(engine.redeemReward).toHaveBeenCalledWith(expect.objectContaining({
      requiredPoints: 250,
      redeemItems: [
        {
          rewardId: 'reward-1',
          quantity: 2,
          pointsPerItem: new Prisma.Decimal('100'),
        },
        {
          rewardId: 'reward-2',
          quantity: 1,
          pointsPerItem: new Prisma.Decimal('50'),
        },
      ],
    }));
  });

  it('rejects insufficient balance', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    prisma.pointsReward.findMany.mockResolvedValue([
      {
        id: 'reward-1',
        pointsRequired: new Prisma.Decimal('100'),
        menuItem: { id: 1, name: 'Coffee', description: 'Hot coffee', images: [] },
      },
    ]);
    prisma.pointsUserState.findUnique.mockResolvedValue({
      currentBalance: new Prisma.Decimal('50'),
    });

    await expect(service.redeem({
      userId: 'user-1',
      items: [{ rewardId: 'reward-1', quantity: 1 }],
    }, 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('rejects invalid reward ids', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    prisma.pointsReward.findMany.mockResolvedValue([]);
    prisma.pointsUserState.findUnique.mockResolvedValue({ currentBalance: new Prisma.Decimal('100') });

    await expect(service.redeem({
      userId: 'user-1',
      items: [{ rewardId: 'reward-1', quantity: 1 }],
    }, 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('rejects invalid quantity', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

    await expect(service.redeem({
      userId: 'user-1',
      items: [{ rewardId: 'reward-1', quantity: 0 }],
    }, 'user-1')).rejects.toThrow(BadRequestException);
  });
});
