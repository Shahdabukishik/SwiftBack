import { Module } from '@nestjs/common';
import { PointsEngineModule } from '../points-engine/points-engine.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PointsRedeemController } from './points-redeem.controller';
import { RedeemPointsService } from './points-redeem.service';

@Module({
  imports: [PrismaModule, PointsEngineModule],
  controllers: [PointsRedeemController],
  providers: [RedeemPointsService],
  exports: [RedeemPointsService],
})
export class PointsRedeemModule {}
