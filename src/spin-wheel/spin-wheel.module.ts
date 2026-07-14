import { Module } from '@nestjs/common';
import { SpinWheelController } from './spin-wheel.controller';
import { SpinWheelService } from './spin-wheel.service';
import { PointsEngineModule } from '../points-engine/points-engine.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, PointsEngineModule],
  controllers: [SpinWheelController],
  providers: [SpinWheelService],
  exports: [SpinWheelService],
})
export class SpinWheelModule {}
