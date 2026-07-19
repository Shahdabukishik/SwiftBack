import { Injectable } from '@nestjs/common';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { PointsEngineService } from '../points-engine/points-engine.service';

@Injectable()
export class AdjustPointsService {

    constructor(
        private readonly pointsEngineService: PointsEngineService,
    ) { }

    async addPoints(
        userId: string,
        dto: AdjustPointsDto,
        adminId: string,
    ) {
        return this.pointsEngineService.adminAdjustment({
            userId,
            createdBy: adminId,
            points: dto.points,
            reason: dto.reason,
        });
    }
}

