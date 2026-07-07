import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdvertisementImagesService } from 'src/advertisement-images/advertisement-images.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';


@Injectable()
export class AdvertisementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly advertisementImagesService: AdvertisementImagesService,
  ) {}

  async create(dto: CreateAdvertisementDto) {
    return this.prisma.advertisement.create({
      data: {
        name: dto.name,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
      include: {
        images: true,
      },
    });
  }

  async findAll() {
    return this.prisma.advertisement.findMany({
      include: {
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const advertisement =
      await this.prisma.advertisement.findUnique({
        where: { id },
        include: {
          images: true,
        },
      });

    if (!advertisement) {
      throw new NotFoundException('Advertisement not found');
    }

    return advertisement;
  }

  async update(id: string, dto: UpdateAdvertisementDto) {
    await this.findOne(id);

    return this.prisma.advertisement.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && {
          description: dto.description,
        }),
        ...(dto.startDate && {
          startDate: new Date(dto.startDate),
        }),
        ...(dto.endDate && {
          endDate: new Date(dto.endDate),
        }),

      },
      include: {
        images: true,
      },
    });
  }

  async remove(id: string) {
    
    const advertisement =
      await this.prisma.advertisement.findUnique({
        where: { id },
        include: {
          images: true,
        },
      });

    if (!advertisement) {
      throw new NotFoundException('Advertisement not found');
    }

    if (advertisement.images.length) {
      
      await this.advertisementImagesService.deleteImages(
        advertisement.images.map((image) => image.id),
      );
    }

    await this.prisma.advertisement.delete({
      where: { id },
    });

    return {
      message: 'Advertisement deleted successfully',
    };
  }
}