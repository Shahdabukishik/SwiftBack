import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface StoreImageUpload {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
}

@Injectable()
export class StoreService {
    constructor(
        private prisma: PrismaService,
        private supabase: SupabaseService
    ) { }

    async create(dto: CreateStoreDto) {
        return this.prisma.store.create({
            data: dto,
        });
    }

    async findAll() {
        return this.prisma.store.findMany();
    }

    async findOne(id: string) {
        return this.prisma.store.findUnique({
            where: { id },
        });
    }

    async remove(id: string) {
        return this.prisma.store.delete({
            where: { id },
        });
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
            data: dto,
        });
    }

    async uploadImages(
        userId: string,
        id: string,
        files: Express.Multer.File[],
    ) {
        const store = await this.prisma.store.findUnique({
            where: { id },
        });

        if (!store) {
            throw new NotFoundException('Store not found');
        }


        const uploadedUrls: string[] = [];

        for (const file of files) {
            const fileName = `${Date.now()}-${file.originalname}`;

            const { error } = await this.supabase.client.storage
                .from('store-images')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                });

            if (error) {
                throw new BadRequestException(error.message);
            }

            const { data } = this.supabase.client.storage
                .from('store-images')
                .getPublicUrl(fileName);

            uploadedUrls.push(data.publicUrl);
        }

        const updatedStore = await this.prisma.store.update({
            where: { id },
            data: {
                images: {
                    push: uploadedUrls, 
                },
            },
        });

        return {
            uploaded: uploadedUrls,
            store: updatedStore,
        };
    }

    async removeImage(
        userId: string,
        storeId: string,
        imageUrl: string,
    ) {
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
        });

        if (!store) {
            throw new NotFoundException('Store not found');
        }

       

       
        const fileName = imageUrl.split('/').pop();


        const { error } = await this.supabase.client.storage
            .from('store-images')
            .remove([fileName]);

        if (error) {
            throw new BadRequestException(error.message);
        }

        
        const updatedStore = await this.prisma.store.update({
            where: { id: storeId },
            data: {
                images: {
                    set: store.images.filter((img) => img !== imageUrl),
                },
            },
        });

        return {
            message: 'Image deleted successfully',
            store: updatedStore,
        };
    }
}
