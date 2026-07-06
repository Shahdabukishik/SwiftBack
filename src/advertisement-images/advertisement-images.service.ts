import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Injectable()
export class AdvertisementImagesService {

    constructor(
            private readonly prisma: PrismaService,
            private readonly supabase: SupabaseService
        ) { }
    
        async uploadImages(advertisementId: string, files: Express.Multer.File[]) {
            const uploads = await Promise.all(
                files.map(async (file) => {
                    const fileName = `${Date.now()}-${file.originalname}`;
    
                    const { data, error } = await this.supabase.client.storage
                        .from('advertisement-images')
                        .upload(fileName, file.buffer, {
                            contentType: file.mimetype,
                        });
    
                    if (error) throw new BadRequestException(error.message);
    
                    const publicUrl = this.supabase.client.storage
                        .from('advertisement-images')
                        .getPublicUrl(fileName).data.publicUrl;
    
                    return this.prisma.advertisementImage.create({
                        data: {
                            advertisementId,
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
            const images = await this.prisma.advertisementImage.findMany({
                where: { id: { in: imageIds } },
            });
    
            if (images.length !== imageIds.length) {
                throw new NotFoundException('One or more images not found');
            }
    
            // 1. delete from Supabase
            const { error } = await this.supabase.client.storage
                .from('advertisement-images')
                .remove(images.map((img) => img.path));
    
            if (error) throw new BadRequestException(error.message);
    
    
            await this.prisma.advertisementImage.deleteMany({
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
