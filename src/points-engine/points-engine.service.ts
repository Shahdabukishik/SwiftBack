import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type PointsDirection = 'credit' | 'debit';
type TransactionKind =
  | 'signup_bonus'
  | 'purchase_earn'
  | 'spin_reward'
  | 'spin_multiplier'
  | 'birthday_bonus'
  | 'redeem'
  |  'admin_adjustment';

type ReferenceKind = 'SIGNUP' | 'PURCHASE' | 'SPIN' | 'REWARD' | 'BIRTHDAY' | 'SYSTEM';

interface BasePointsOperation {
  userId: string;
  createdBy: string;
  referenceId?: string;
}

interface AwardSignupBonusInput extends BasePointsOperation { }

interface AwardPurchasePointsInput extends BasePointsOperation {
  purchaseAmount: number;
  purchaseId: string;
}

interface AwardSpinRewardInput extends BasePointsOperation {
  points: number;
  spinWheelSpinId: string;
}

interface ApplySpinMultiplierInput extends BasePointsOperation {
  multiplier: number;
  spinWheelSpinId: string;
}

interface AwardBirthdayBonusInput extends BasePointsOperation { }

interface RedeemRewardItemInput {
  rewardId: string;
  quantity: number;
  pointsPerItem: Prisma.Decimal | number;
}

interface RedeemRewardInput extends BasePointsOperation {
  requiredPoints: number;
  redeemItems: RedeemRewardItemInput[];
}

interface TransactionInput extends BasePointsOperation {
  type: TransactionKind;
  mode: PointsDirection;
  referenceType?: ReferenceKind;
  referenceId?: string;
}
interface TransactionMetadata {
  reason?: string;
}

interface TransactionContext {
  tx: Prisma.TransactionClient;
  currentLevel: Prisma.PointsLevelGetPayload<{}> | null;
  state: {
    userId: string;
    currentBalance: Prisma.Decimal;
    currentLevelId: string | null;
    periodPointsEarned: Prisma.Decimal;
  };
}

interface AdminAdjustmentInput extends BasePointsOperation {
  points: number;
  reason: string;
}

@Injectable()
export class PointsEngineService {
  constructor(private readonly prisma: PrismaService) { }

  // Each public entrypoint intentionally delegates to applyTransaction() so
  // every points action shares one consistent path for validation, locking,
  // ledger creation, balance updates, and level resolution.
  async awardSignupBonus(input: AwardSignupBonusInput) {
    return this.applyTransaction(
      {
        userId: input.userId,
        createdBy: input.createdBy,
        type: 'signup_bonus',
        mode: 'credit',
        referenceType: 'SIGNUP',
        referenceId: input.referenceId,
      },
      async ({ tx }) => {
        const settings = await this.getPointsSettings(tx);
        return settings.signupBonusPoints;
      },
    );
  }

  async awardPurchasePoints(input: AwardPurchasePointsInput) {
    this.assertNonNegativeNumber(input.purchaseAmount, 'purchaseAmount');
    this.assertRequiredId(input.purchaseId, 'purchaseId');

    return this.applyTransaction(
      {
        userId: input.userId,
        createdBy: input.createdBy,
        type: 'purchase_earn',
        mode: 'credit',
        referenceType: 'PURCHASE',
        referenceId: input.purchaseId,
      },
      async ({ currentLevel }) => {
        const earnRate = Number(currentLevel?.earnRate ?? 0);
        return input.purchaseAmount * earnRate;
      },
    );
  }

  async awardSpinReward(input: AwardSpinRewardInput) {
    this.assertNonNegativeNumber(input.points, 'points');
    this.assertRequiredId(input.spinWheelSpinId, 'spinWheelSpinId');

    return this.applyTransaction(
      {
        userId: input.userId,
        createdBy: input.createdBy,
        type: 'spin_reward',
        mode: 'credit',
        referenceType: 'SPIN',
        referenceId: input.spinWheelSpinId,
      },
      async () => input.points,
    );
  }

  async applySpinMultiplier(input: ApplySpinMultiplierInput) {
    this.assertRequiredId(input.spinWheelSpinId, 'spinWheelSpinId');
    if (input.multiplier <= 1) {
      throw new BadRequestException('multiplier must be greater than 1');
    }

    return this.applyTransaction(
      {
        userId: input.userId,
        createdBy: input.createdBy,
        type: 'spin_multiplier',
        mode: 'credit',
        referenceType: 'SPIN',
        referenceId: input.spinWheelSpinId,
      },
      async ({ state }) => {
        const balance = Number(state.currentBalance);
        return balance * input.multiplier - balance;
      },
    );
  }

  async awardBirthdayBonus(input: AwardBirthdayBonusInput) {
    return this.applyTransaction(
      {
        userId: input.userId,
        createdBy: input.createdBy,
        type: 'birthday_bonus',
        mode: 'credit',
        referenceType: 'BIRTHDAY',
        referenceId: input.referenceId,
      },
      async ({ tx }) => {
        const settings = await this.getPointsSettings(tx);
        return settings.birthdayBonusPoints;
      },
    );
  }

  async redeemReward(input: RedeemRewardInput) {
    this.assertNonNegativeNumber(input.requiredPoints, 'requiredPoints');
    if (!input.redeemItems?.length) {
      throw new BadRequestException('redeemItems must contain at least one item');
    }

    return this.applyTransaction(
      {
        userId: input.userId,
        createdBy: input.createdBy,
        type: 'redeem',
        mode: 'debit',
        referenceType: 'REWARD',
        referenceId: input.redeemItems[0]?.rewardId,
      },
      async () => -input.requiredPoints,
      undefined,
      async ({ tx, transaction }) => {
        await tx.pointsRedeemItem.createMany({
          data: input.redeemItems.map((item) => ({
            transactionId: transaction.id,
            rewardId: item.rewardId,
            quantity: item.quantity,
            pointsPerItem: this.toDecimal(item.pointsPerItem),
            totalPoints: this.toDecimal(Number(this.toDecimal(item.pointsPerItem)) * item.quantity),
          })),
        });
      },
    );
  }

  private async applyTransaction(
    input: TransactionInput,
    resolvePoints: (
      context: TransactionContext,
    ) => Promise<Prisma.Decimal | number>,
    metadata?: TransactionMetadata,
    onTransactionCreated?: (context: { tx: Prisma.TransactionClient; transaction: Prisma.PointsTransactionGetPayload<{}>; state: { currentBalance: Prisma.Decimal; currentLevelId: string | null; periodPointsEarned: Prisma.Decimal; userId: string; }; }) => Promise<unknown>,
  ) {
    this.assertRequiredId(input.userId, 'userId');
    this.assertRequiredId(input.createdBy, 'createdBy');

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${input.userId}::text))`);

      const user = await tx.user.findUnique({
        where: { id: input.userId },
        select: { id: true },
      });

      if (!user) {
        throw new BadRequestException('user not found');
      }

      let state = await tx.pointsUserState.findUnique({
        where: { userId: input.userId },
      });

      if (!state) {
        state = await tx.pointsUserState.create({
          data: {
            userId: input.userId,
            currentBalance: 0,
            periodPointsEarned: 0,
            currentLevelId: null,
          },
        });
      }

      const currentBalance = this.toDecimal(state.currentBalance);
      const currentPeriodPoints = this.toDecimal(state.periodPointsEarned);
      const currentLevel = state.currentLevelId
        ? await this.getLevelById(tx, state.currentLevelId)
        : await this.resolveLevel(tx, currentPeriodPoints);

      const context: TransactionContext = {
        tx,
        currentLevel,
        state: {
          userId: input.userId,
          currentBalance,
          currentLevelId: state.currentLevelId,
          periodPointsEarned: currentPeriodPoints,
        },
      };

      const signedDelta = this.toDecimal(await resolvePoints(context));
      const nextBalance = this.toDecimal(
        Number(currentBalance) + Number(signedDelta),
      );

      if (input.mode === 'debit' && Number(nextBalance) < 0) {
        throw new BadRequestException('insufficient points balance');
      }

      const nextPeriodPoints =
        input.mode === 'credit'
          ? this.toDecimal(Number(currentPeriodPoints) + Math.max(0, Number(signedDelta)))
          : currentPeriodPoints;

      const nextLevel =
        input.mode === 'credit'
          ? await this.resolveLevel(tx, nextPeriodPoints)
          : currentLevel;

      const transaction = await tx.pointsTransaction.create({
        data: {
          userId: input.userId,
          type: input.type,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          points: signedDelta,
          balanceAfter: nextBalance,
          createdBy: input.createdBy,
          reason: metadata?.reason,
        },
      });

      await tx.pointsUserState.update({
        where: { userId: input.userId },
        data: {
          currentBalance: nextBalance,
          periodPointsEarned: nextPeriodPoints,
          currentLevelId: nextLevel?.id ?? state.currentLevelId ?? null,
        },
      });

      if (onTransactionCreated) {
        await onTransactionCreated({
          tx,
          transaction,
          state: {
            userId: input.userId,
            currentBalance: nextBalance,
            currentLevelId: nextLevel?.id ?? state.currentLevelId ?? null,
            periodPointsEarned: nextPeriodPoints,
          },
        });
      }

      return {
        transaction,
        state: {
          userId: input.userId,
          currentBalance: nextBalance,
          periodPointsEarned: nextPeriodPoints,
          currentLevel: nextLevel,
        },
      };
    });
  }

  private async resolveLevel(
    tx: Prisma.TransactionClient,
    periodPointsEarned: Prisma.Decimal | number,
  ) {
    const levels = await tx.pointsLevel.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const periodValue = Number(periodPointsEarned);

    let selectedLevel: (typeof levels)[number] | null = null;
    for (const level of levels) {
      if (Number(level.minPeriodPoints) <= periodValue) {
        selectedLevel = level;
      } else {
        break;
      }
    }

    return selectedLevel;
  }

  private async getLevelById(tx: Prisma.TransactionClient, levelId: string) {
    return tx.pointsLevel.findUnique({
      where: { id: levelId },
    });
  }

  private async getPointsSettings(tx: Prisma.TransactionClient) {
    let settings = await tx.pointsSetting.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await tx.pointsSetting.create({
        data: {
          id: 1,
          evaluationPeriodDays: 90,
          signupBonusPoints: 100,
          birthdayBonusPoints: 50,
          updatedBy: 'system',
        },
      });
    }

    return {
      signupBonusPoints: this.toDecimal(settings.signupBonusPoints),
      birthdayBonusPoints: this.toDecimal(settings.birthdayBonusPoints),
    };
  }

  private assertNonNegativeNumber(value: number, name: string) {
    if (value === null || value === undefined || Number.isNaN(value) || value < 0) {
      throw new BadRequestException(`${name} must be a non-negative number`);
    }
  }

  private assertRequiredId(value: string | undefined, name: string) {
    if (!value || value.trim() === '') {
      throw new BadRequestException(`${name} is required`);
    }
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


  async adminAdjustment(input: AdminAdjustmentInput) {
    this.assertNonNegativeNumber(input.points, 'points');

    if (!input.reason?.trim()) {
      throw new BadRequestException('reason is required');
    }

    return this.applyTransaction(
      {
        userId: input.userId,
        createdBy: input.createdBy,
        type: 'admin_adjustment',
        mode: 'credit',
        referenceType: 'SYSTEM',
      },
      async () => input.points,
      {
        reason: input.reason,

      },
    );
  }
}
