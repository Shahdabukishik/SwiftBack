import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { MenuItemImagesService } from 'src/menu-item-images/menu-item-images.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItemsQueryDto } from './dto/menu-items-query.dto';

@Injectable()
export class MenuItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly menuItemImagesService: MenuItemImagesService,
  ) {}

  private async assertCategoryExists(categoryId: number) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  async create(dto: CreateMenuItemDto, userId: string) {
    await this.assertCategoryExists(dto.categoryId);

    const sortOrder = dto.sortOrder ?? 0;

    return this.prisma.$transaction(async (tx) => {
      await tx.menuItem.updateMany({
        where: {
          categoryId: dto.categoryId,
          sortOrder: { gte: sortOrder },
        },
        data: { sortOrder: { increment: 1 } },
      });

      return tx.menuItem.create({
        data: {
          categoryId: dto.categoryId,
          name: dto.name,
          description: dto.description,
          price: dto.price,
          sortOrder,
          active: dto.active ?? true,
          createdBy: userId,
          updatedBy: userId,
        },
        include: { images: true },
      });
    });
  }

  async findAll(queryDto: MenuItemsQueryDto) {
    const { categoryId } = queryDto;

    const where: Prisma.MenuItemWhereInput = {
      ...(categoryId !== undefined && { categoryId }),
    };

    return this.prisma.menuItem.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { images: true },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return item;
  }

  async update(id: number, dto: UpdateMenuItemDto, userId: string) {
    const existing = await this.findOne(id);

    if (dto.categoryId !== undefined) {
      await this.assertCategoryExists(dto.categoryId);
    }

    const categoryId = dto.categoryId ?? existing.categoryId;

    return this.prisma.$transaction(async (tx) => {
      if (
        dto.sortOrder !== undefined &&
        dto.sortOrder !== existing.sortOrder
      ) {
        await tx.menuItem.updateMany({
          where: {
            id: { not: id },
            categoryId,
            sortOrder: { gte: dto.sortOrder },
          },
          data: { sortOrder: { increment: 1 } },
        });
      }

      return tx.menuItem.update({
        where: { id },
        data: {
          ...(dto.categoryId !== undefined && {
            categoryId: dto.categoryId,
          }),
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(dto.active !== undefined && { active: dto.active }),
          updatedBy: userId,
        },
        include: { images: true },
      });
    });
  }

  async remove(id: number) {
    const item = await this.findOne(id);

    if (item.images.length) {
      await this.menuItemImagesService.deleteImages(
        item.images.map((image) => image.id),
      );
    }

    await this.prisma.menuItem.delete({ where: { id } });

    return { message: 'Item deleted successfully' };
  }
}
