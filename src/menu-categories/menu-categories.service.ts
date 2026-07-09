import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';

@Injectable()
export class MenuCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMenuCategoryDto, userId: string) {
    const sortOrder = dto.sortOrder ?? 0;

    return this.prisma.$transaction(async (tx) => {
      await tx.menuCategory.updateMany({
        where: { sortOrder: { gte: sortOrder } },
        data: { sortOrder: { increment: 1 } },
      });

      return tx.menuCategory.create({
        data: {
          name: dto.name,
          sortOrder,
          active: dto.active ?? true,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.menuCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: number, dto: UpdateMenuCategoryDto, userId: string) {
    const existing = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.sortOrder !== undefined && dto.sortOrder !== existing.sortOrder) {
        await tx.menuCategory.updateMany({
          where: {
            id: { not: id },
            sortOrder: { gte: dto.sortOrder },
          },
          data: { sortOrder: { increment: 1 } },
        });
      }

      return tx.menuCategory.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(dto.active !== undefined && { active: dto.active }),
          updatedBy: userId,
        },
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const itemCount = await this.prisma.menuItem.count({
      where: { categoryId: id },
    });

    if (itemCount > 0) {
      throw new ConflictException(
        'Category has menu items, move or delete them first',
      );
    }

    await this.prisma.menuCategory.delete({ where: { id } });

    return { message: 'Category deleted successfully' };
  }
}
