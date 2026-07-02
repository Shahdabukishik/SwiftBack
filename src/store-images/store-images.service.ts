import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class StoreImagesService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly supabase: SupabaseService
    ) { }

    async uploadImages(storeId: string, files: Express.Multer.File[]) {
        const uploads = await Promise.all(
            files.map(async (file) => {
                const fileName = `${Date.now()}-${file.originalname}`;

                const { data, error } = await this.supabase.client.storage
                    .from('store-images')
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                    });

                if (error) throw new BadRequestException(error.message);

                const publicUrl = this.supabase.client.storage
                    .from('store-images')
                    .getPublicUrl(fileName).data.publicUrl;

                return this.prisma.storeImage.create({
                    data: {
                        storeId,
                        url: publicUrl,
                        path: fileName,
                        size: file.size,
                        mimeType: file.mimetype,
                    },
                });
            }),
        );

        return uploads;
    }

    async deleteImages(imageIds: string[]) {
        const images = await this.prisma.storeImage.findMany({
            where: { id: { in: imageIds } },
        });

        if (images.length !== imageIds.length) {
            throw new NotFoundException('One or more images not found');
        }

        // 1. delete from Supabase
        const { error } = await this.supabase.client.storage
            .from('store-images')
            .remove(images.map((img) => img.path));

        if (error) throw new BadRequestException(error.message);


        await this.prisma.storeImage.deleteMany({
            where: {
                id: {
                    in: images.map(
                        (image) => image.id,
                    ),
                },
            },
        });

        return {
            message: `${images.length} image(s) deleted successfully`,
        };
    }

}
