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


  
}
