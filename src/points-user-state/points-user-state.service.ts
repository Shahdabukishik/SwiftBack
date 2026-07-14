import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PointsUserStateService {
    constructor(private readonly prisma: PrismaService) { }

    private readonly userStateSelection = {
        userId: true,
        currentBalance: true,
        periodPointsEarned: true,
        updatedAt: true,
        currentLevel: {
            select: {
                id: true,
                name: true,
                earnRate: true,
                minPeriodPoints: true,
            },
        },
    };

    private formatStateResponse(state: any) {
        if (!state) return null;
        return {
            ...state,
            currentBalance: state.currentBalance ? Number(state.currentBalance) : 0,
            periodPointsEarned: state.periodPointsEarned ? Number(state.periodPointsEarned) : 0,
        };
    }

    private buildDefaultUserState(userId: string) {
        return {
            userId,
            currentBalance: 0,
            periodPointsEarned: 0,
            updatedAt: new Date(),
            currentLevel: null,
        };
    }

    async getUserState(userId: string) {
        try {
            const state = await this.prisma.pointsUserState.findUnique({
                where: { userId },
                select: this.userStateSelection,
            });

            if (!state) {
                return this.buildDefaultUserState(userId);
            }

            return this.formatStateResponse(state);
        } catch (error) {
            throw new InternalServerErrorException(
                'Failed to retrieve the user points state.',
            );
        }
    }

    async getPaginatedStates(paginationDto: PaginationDto) {
        try {
            // Safely fall back to defaults and enforce max business limit of 100
            const page = Math.max(1, Number(paginationDto.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(paginationDto.limit) || 20));
            const skip = (page - 1) * limit;

            const [data, total] = await Promise.all([
                this.prisma.pointsUserState.findMany({
                    skip,
                    take: limit,
                    orderBy: {
                        currentBalance: 'desc',
                    },
                    select: this.userStateSelection,
                }),
                this.prisma.pointsUserState.count(),
            ]);

            return {
                data: data.map((item) => this.formatStateResponse(item)),
                meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            throw new InternalServerErrorException(
                'Failed to retrieve paginated points states.',
            );
        }
    }
}