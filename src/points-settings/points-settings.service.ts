import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path as needed for your project structure
import { UpdatePointsSettingsDto } from './dto/update-points-settings.dto';

@Injectable()
export class PointsSettingsService {
  // Constant hardcoded to enforce the singleton constraint
  private readonly SINGLETON_ID = 1;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to guarantee the settings record exists.
   * If it doesn't, it creates the row with default values.
   */
  private async ensureSettingsExist() {
    let settings = await this.prisma.pointsSetting.findUnique({
      where: { id: this.SINGLETON_ID },
    });

    if (!settings) {
      try {
        settings = await this.prisma.pointsSetting.create({
          data: {
            id: this.SINGLETON_ID,
            evaluationPeriodDays: 90,
            signupBonusPoints: 100,
            birthdayBonusPoints: 50,
            updatedBy: 'system',
          },
        });
      } catch (error) {
        // Fallback for race condition: If another concurrent process just created it,
        // the unique constraint fails. We simply fetch the newly created record.
        settings = await this.prisma.pointsSetting.findUnique({
          where: { id: this.SINGLETON_ID },
        });

        if (!settings) {
          throw new InternalServerErrorException(
            'Failed to initialize points settings singleton.',
          );
        }
      }
    }

    return settings;
  }

  /**
   * Retrieves the current system settings, initializing them if necessary.
   */
  async getSettings() {
    return this.ensureSettingsExist();
  }

  /**
   * Updates the singleton settings record.
   */
  async updateSettings(userId: string, dto: UpdatePointsSettingsDto) {
    // Ensure the record exists before attempting an update
    await this.ensureSettingsExist();

    return this.prisma.pointsSetting.update({
      where: { id: this.SINGLETON_ID },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }
}