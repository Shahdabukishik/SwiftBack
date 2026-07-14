import { Module } from '@nestjs/common';
import { PointsUserStateController } from './points-user-state.controller';
import { PointsUserStateService } from './points-user-state.service';

@Module({
  controllers: [PointsUserStateController],
  providers: [PointsUserStateService],
  exports: [PointsUserStateService],
})
export class PointsUserStateModule {}
