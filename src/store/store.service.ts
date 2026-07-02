import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SupabaseService } from '../supabase/supabase.service';
import { StoreImagesService } from 'src/store-images/store-images.service';

interface StoreImageUpload {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
}

@Injectable()
export class StoreService {
    constructor(
        private prisma: PrismaService,
        private supabase: SupabaseService,
        private readonly storeImagesService: StoreImagesService,
    ) { }

    async create(dto: CreateStoreDto) {
        return this.prisma.store.create({
            data: {
                name: dto.name,
                address: dto.address,
                phone: dto.phone,
                workingHours: dto.workingHours as any,
            },
        });
    }

    async findAll() {
        return this.prisma.store.findMany(
            {
                include: {
                    images: true,
                },
            }
        );
    }

    async findOne(id: string) {
        return this.prisma.store.findUnique({
            where: { id },
            include: {
                images: true,
            },
        });
    }

    async remove(id: string) {
        const store = await this.prisma.store.findUnique({
            where: { id },
            include: {
                images: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!store) {
            throw new NotFoundException('Store not found');
        }

        if (store.images.length > 0) {
            await this.storeImagesService.deleteImages(
                store.images.map((image) => image.id),
            );
        }

        await this.prisma.store.delete({
            where: { id },
        });

        return {
            message: 'Store deleted successfully',
        };
    }

    async update(id: string, dto: UpdateStoreDto) {
        const store = await this.prisma.store.findUnique({
            where: { id },
        });

        if (!store) {
            throw new NotFoundException('Store not found');
        }

        return this.prisma.store.update({
            where: { id },
            data: {
                name: dto.name,
                address: dto.address,
                phone: dto.phone,
                workingHours: dto.workingHours as any,
            }
        });
    }



}
