import { Module } from '@nestjs/common';
import { AdjustPointsController } from './adjust-points.controller';
import { AdjustPointsService } from './adjust-points.service';
import { PointsEngineModule } from '../points-engine/points-engine.module'; 

@Module({
  imports: [
    PointsEngineModule,
  ],
  controllers: [AdjustPointsController],
  providers: [AdjustPointsService]
})
export class AdjustPointsModule {}
