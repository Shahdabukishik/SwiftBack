import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path to your PrismaService
import { CreatePointsLevelDto } from './dto/create-points-level.dto';
import { UpdatePointsLevelDto } from './dto/update-points-level.dto';

@Injectable()
export class PointsLevelService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPointsLevelDto: CreatePointsLevelDto, userId: string) {
    return await this.prisma.pointsLevel.create({
      data: {
        ...createPointsLevelDto,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async findAll() {
    return await this.prisma.pointsLevel.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const pointsLevel = await this.prisma.pointsLevel.findUnique({
      where: { id },
    });

    if (!pointsLevel) {
      throw new NotFoundException(`Points level with ID ${id} not found.`);
    }

    return pointsLevel;
  }

  async update(
    id: string,
    updatePointsLevelDto: UpdatePointsLevelDto,
    userId: string,
  ) {
    // Ensure existence before attempting to update to throw proper 404
    await this.findOne(id);

    return await this.prisma.pointsLevel.update({
      where: { id },
      data: {
        ...updatePointsLevelDto,
        updatedBy: userId,
      },
    });
  }

  async remove(id: string) {
    const pointsLevel = await this.prisma.pointsLevel.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userStates: true },
        },
      },
    });

    if (!pointsLevel) {
      throw new NotFoundException(`Points level with ID ${id} not found.`);
    }

    if (pointsLevel._count.userStates > 0) {
      throw new ConflictException(
        'Cannot delete a loyalty level currently assigned to users.',
      );
    }

    return await this.prisma.pointsLevel.delete({
      where: { id },
    });
  }
}