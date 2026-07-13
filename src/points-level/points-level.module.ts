import { Module } from '@nestjs/common';
import { PointsLevelService } from './points-level.service';
import { PointsLevelController } from './points-level.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Adjust path to your PrismaModule

@Module({
  imports: [PrismaModule],
  controllers: [PointsLevelController],
  providers: [PointsLevelService],
  exports: [PointsLevelService],
})
export class PointsLevelModule {}