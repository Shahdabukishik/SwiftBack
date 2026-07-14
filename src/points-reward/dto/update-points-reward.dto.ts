import { PartialType } from '@nestjs/swagger';
import { CreatePointsRewardDto } from './create-points-reward.dto';

export class UpdatePointsRewardDto extends PartialType(CreatePointsRewardDto) {}