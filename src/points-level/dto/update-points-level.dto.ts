import { PartialType } from '@nestjs/swagger';
import { CreatePointsLevelDto } from './create-points-level.dto';

export class UpdatePointsLevelDto extends PartialType(CreatePointsLevelDto) {}