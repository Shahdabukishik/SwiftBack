import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AddPurchasePointsDto } from './dto/add-purchase-points.dto';
import { PointsEngineService } from '../points-engine/points-engine.service';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdjustPointsService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly pointsEngineService: PointsEngineService,
    ) { }

    async addPurchase(
        dto: AddPurchasePointsDto,
        cashierId: string,
    ) {
        return this.pointsEngineService.awardPurchasePoints({
            userId: dto.userId,
            createdBy: cashierId,
            purchaseAmount: dto.purchaseAmount,
        });
    }

    async addPoints(dto: AdjustPointsDto, adminId: string) {
        return this.pointsEngineService.adminAdjustment({
            userId: dto.userId,
            createdBy: adminId,
            points: dto.points,
            mode: 'credit',
            reason: 'Points added by admin',
        });
    }

    async removePoints(dto: AdjustPointsDto, adminId: string) {
        return this.pointsEngineService.adminAdjustment({
            userId: dto.userId,
            createdBy: adminId,
            points: dto.points,
            mode: 'debit',
            reason: 'Points removed by admin',
        });
    }
}

