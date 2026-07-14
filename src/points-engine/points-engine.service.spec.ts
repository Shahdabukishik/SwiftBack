import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PointsEngineService } from './points-engine.service';

describe('PointsEngineService', () => {
  let service: PointsEngineService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
    };

    service = new PointsEngineService(prisma);
  });

  it('awards purchase points through a single transactional flow', async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(undefined),
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
      pointsSetting: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      pointsLevel: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      pointsUserState: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ userId: 'user-1' }),
        update: jest.fn().mockResolvedValue({ userId: 'user-1' }),
      },
      pointsTransaction: {
        create: jest.fn().mockResolvedValue({ id: 'txn-1' }),
      },
    };

    prisma.$transaction.mockImplementation(async (callback: any) => callback(tx));

    await service.awardPurchasePoints({
      userId: 'user-1',
      purchaseAmount: 100,
      purchaseId: 'purchase-1',
      createdBy: 'system',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.$executeRaw).toHaveBeenCalled();
    expect(tx.pointsUserState.create).toHaveBeenCalled();
    expect(tx.pointsTransaction.create).toHaveBeenCalled();
  });

  it('rejects negative purchase amounts', async () => {
    await expect(
      service.awardPurchasePoints({
        userId: 'user-1',
        purchaseAmount: -10,
        purchaseId: 'purchase-1',
        createdBy: 'system',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects multiplier values at or below one', async () => {
    await expect(
      service.applySpinMultiplier({
        userId: 'user-1',
        multiplier: 1,
        spinWheelSpinId: 'spin-1',
        createdBy: 'system',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
