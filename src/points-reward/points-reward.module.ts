import { Module } from '@nestjs/common';
import { PointsRewardsService } from './points-reward.service';
import { PointsRewardsController } from './points-reward.controller';

@Module({
    
    controllers: [PointsRewardsController],
    providers: [PointsRewardsService],
    exports: [PointsRewardsService],
})
export class PointsRewardModule { }
