import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma, SpinWheelPrize } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SaveWheelConfigDto } from './dto/save-wheel-config.dto';

const SETTINGS_ID = 1;
const DEFAULT_COOLDOWN_HOURS = 24;
const BASIS_POINTS_TOTAL = 10000;

type Tx = Prisma.TransactionClient;

@Injectable()
export class SpinWheelService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateSettings(client: Tx | PrismaService = this.prisma, userId = 'system') {
    return client.spinWheelSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: {
        id: SETTINGS_ID,
        cooldownHours: DEFAULT_COOLDOWN_HOURS,
        updatedBy: userId,
      },
    });
  }

  private toBasisPoints(percent: number): number {
    return Math.round(percent * 100);
  }

  private validateActiveProbabilitySum(prizes: SaveWheelConfigDto['prizes']) {
    const activePrizes = prizes.filter((p) => p.active !== false);

    const totalBasisPoints = activePrizes.reduce(
      (sum, p) => sum + this.toBasisPoints(p.probabilityPercent),
      0,
    );

    if (totalBasisPoints !== BASIS_POINTS_TOTAL) {
      const gotPercent = totalBasisPoints / 100;
      throw new BadRequestException(
        `Prize probabilities must sum to 100%, got ${gotPercent}%`,
      );
    }
  }

  private computeNextEligibleAt(
    lastSpunAt: Date | null,
    cooldownHours: number,
  ): Date | null {
    if (!lastSpunAt) return null;
    return new Date(lastSpunAt.getTime() + cooldownHours * 60 * 60 * 1000);
  }

  private formatCooldownMessage(nextEligibleAt: Date): string {
    const msRemaining = nextEligibleAt.getTime() - Date.now();
    const hoursRemaining = Math.max(1, Math.ceil(msRemaining / (60 * 60 * 1000)));
    return `You can spin again in ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}`;
  }

  private selectWeightedPrize(prizes: SpinWheelPrize[]): SpinWheelPrize {
    const weights = prizes.map((p) => this.toBasisPoints(p.probabilityPercent.toNumber()));
    const total = weights.reduce((sum, w) => sum + w, 0);

    const roll = randomInt(0, total);

    let cumulative = 0;
    for (let i = 0; i < prizes.length; i++) {
      cumulative += weights[i];
      if (roll < cumulative) {
        return prizes[i];
      }
    }

    return prizes[prizes.length - 1];
  }

  async getConfig() {
    const [prizes, settings] = await Promise.all([
      this.prisma.spinWheelPrize.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.getOrCreateSettings(),
    ]);

    return {
      prizes,
      cooldownHours: settings.cooldownHours,
    };
  }

  async saveConfig(dto: SaveWheelConfigDto, userId: string) {
    this.validateActiveProbabilitySum(dto.prizes);

    const existingIds = (
      await this.prisma.spinWheelPrize.findMany({ select: { id: true } })
    ).map((p) => p.id);

    const payloadIds = dto.prizes
      .map((p) => p.id)
      .filter((id): id is string => !!id);

    const idsToDelete = existingIds.filter((id) => !payloadIds.includes(id));

    await this.prisma.$transaction(async (tx) => {
      if (idsToDelete.length) {
        await tx.spinWheelPrize.deleteMany({ where: { id: { in: idsToDelete } } });
      }

      for (const prize of dto.prizes) {
        if (prize.id) {
          await tx.spinWheelPrize.update({
            where: { id: prize.id },
            data: {
              label: prize.label,
              type: prize.type,
              value: prize.value,
              probabilityPercent: prize.probabilityPercent,
              sortOrder: prize.sortOrder,
              active: prize.active ?? true,
              updatedBy: userId,
            },
          });
        } else {
          await tx.spinWheelPrize.create({
            data: {
              label: prize.label,
              type: prize.type,
              value: prize.value,
              probabilityPercent: prize.probabilityPercent,
              sortOrder: prize.sortOrder,
              active: prize.active ?? true,
              createdBy: userId,
              updatedBy: userId,
            },
          });
        }
      }

      await tx.spinWheelSettings.upsert({
        where: { id: SETTINGS_ID },
        update: { cooldownHours: dto.cooldownHours, updatedBy: userId },
        create: {
          id: SETTINGS_ID,
          cooldownHours: dto.cooldownHours,
          updatedBy: userId,
        },
      });
    });

    return this.getConfig();
  }

  async getWheel(userId: string) {
    const [prizes, settings, lastSpin] = await Promise.all([
      this.prisma.spinWheelPrize.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, label: true, sortOrder: true },
      }),
      this.getOrCreateSettings(),
      this.prisma.spinWheelSpin.findFirst({
        where: { userId },
        orderBy: { spunAt: 'desc' },
      }),
    ]);

    const nextEligibleAt = this.computeNextEligibleAt(
      lastSpin?.spunAt ?? null,
      settings.cooldownHours,
    );

    return {
      prizes,
      totalPrizes: prizes.length,
      canSpin: !nextEligibleAt || nextEligibleAt <= new Date(),
      nextEligibleAt: nextEligibleAt ? nextEligibleAt.toISOString() : null,
    };
  }

  async spin(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

      const [settings, lastSpin] = await Promise.all([
        this.getOrCreateSettings(tx),
        tx.spinWheelSpin.findFirst({
          where: { userId },
          orderBy: { spunAt: 'desc' },
        }),
      ]);

      const nextEligibleFromLastSpin = this.computeNextEligibleAt(
        lastSpin?.spunAt ?? null,
        settings.cooldownHours,
      );

      if (nextEligibleFromLastSpin && nextEligibleFromLastSpin > new Date()) {
        throw new ConflictException(
          this.formatCooldownMessage(nextEligibleFromLastSpin),
        );
      }

      const activePrizes = await tx.spinWheelPrize.findMany({
        where: { active: true },
      });

      if (!activePrizes.length) {
        throw new ConflictException('No prizes available');
      }

      const selected = this.selectWeightedPrize(activePrizes);
      const spunAt = new Date();

      await tx.spinWheelSpin.create({
        data: {
          userId,
          prizeId: selected.id,
          rewardType: selected.type,
          rewardValue: selected.value,
          spunAt,
        },
      });

      // Points crediting (SPIN_REWARD / SPIN_REWARD_MULTIPLIER) is owned by the
      // future Points/Loyalty Ledger module — integration point, not implemented here.

      const nextEligibleAt = this.computeNextEligibleAt(spunAt, settings.cooldownHours)!;

      return {
        prize: {
          id: selected.id,
          label: selected.label,
          type: selected.type,
          value: selected.value,
        },
        nextEligibleAt: nextEligibleAt.toISOString(),
      };
    });
  }
}
