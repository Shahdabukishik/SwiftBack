import { Injectable } from '@nestjs/common';
import { AddPurchasePointsDto } from './dto/add-purchase-points.dto';
import { PointsEngineService } from '../points-engine/points-engine.service';

@Injectable()
export class AdjustPointsService {

    constructor(
        private readonly pointsEngineService: PointsEngineService,
    ) { }

    async addPoints(
        dto: AddPurchasePointsDto,
        cashierId: string,
    ) {
        return this.pointsEngineService.awardPurchasePoints({
            userId: dto.userId,
            createdBy: cashierId,
            purchaseAmount: dto.purchaseAmount,
        });
    }
}

