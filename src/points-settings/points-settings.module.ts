import { Module } from '@nestjs/common';
import { PointsSettingsController } from './points-settings.controller';
import { PointsSettingsService } from './points-settings.service';

@Module({
  controllers: [PointsSettingsController],
  providers: [PointsSettingsService],
  exports: [PointsSettingsService], 
})
export class PointsSettingsModule {}