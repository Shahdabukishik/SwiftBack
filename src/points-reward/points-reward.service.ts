import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path if necessary
import { CreatePointsRewardDto } from './dto/create-points-reward.dto';
import { UpdatePointsRewardDto } from './dto/update-points-reward.dto';

@Injectable()
export class PointsRewardsService {
    constructor(private readonly prisma: PrismaService) { }

    private readonly defaultSelect = {
        id: true,
        pointsRequired: true,
        createdAt: true,
        updatedAt: true,
        menuItem: {
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                active: true,
            },
        },
    };

    async create(createPointsRewardDto: CreatePointsRewardDto) {
        const { menuItemId, pointsRequired } = createPointsRewardDto;

        const menuItem = await this.prisma.menuItem.findUnique({
            where: { id: menuItemId },
        });

        if (!menuItem) {
            throw new NotFoundException('Menu item not found.');
        }

        const existingReward = await this.prisma.pointsReward.findFirst({
            where: { menuItemId },
        });

        if (existingReward) {
            throw new ConflictException(
                'Reward already exists for this menu item.',
            );
        }

        return this.prisma.pointsReward.create({
            data: {
                menuItemId,
                pointsRequired,
            },
            select: this.defaultSelect,
        });
    }

    async findAll() {
        return this.prisma.pointsReward.findMany({
            select: this.defaultSelect,
            orderBy: {
                menuItem: {
                    name: 'asc',
                },
            },
        });
    }

    async findOne(id: string) {
        const reward = await this.prisma.pointsReward.findUnique({
            where: { id },
            select: this.defaultSelect,
        });

        if (!reward) {
            throw new NotFoundException('Points reward not found.');
        }

        return reward;
    }

    async update(id: string, updatePointsRewardDto: UpdatePointsRewardDto) {
        await this.findOne(id); // Verifies existence, throws 404 if missing

        if (updatePointsRewardDto.menuItemId) {
            const menuItem = await this.prisma.menuItem.findUnique({
                where: { id: updatePointsRewardDto.menuItemId },
            });

            if (!menuItem) {
                throw new NotFoundException('Target menu item not found.');
            }

            const existingReward = await this.prisma.pointsReward.findFirst({
                where: {
                    menuItemId: updatePointsRewardDto.menuItemId,
                    id: { not: id },
                },
            });

            if (existingReward) {
                throw new ConflictException(
                    'Reward already exists for this menu item.',
                );
            }
        }

        return this.prisma.pointsReward.update({
            where: { id },
            data: updatePointsRewardDto,
            select: this.defaultSelect,
        });
    }

    async remove(id: string) {
        await this.findOne(id); // Verifies existence, throws 404 if missing

        await this.prisma.pointsReward.delete({
            where: { id },
        });

        return { message: 'Points reward successfully deleted.' };
    }
}