import { Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class MenuItemImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async uploadImages(itemId: number, files: Express.Multer.File[]) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const uploads = await Promise.all(
      files.map(async (file) => {
        const fileName = `${Date.now()}-${file.originalname}`;

        const { error } = await this.supabase.client.storage
          .from('menu-item-images')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) throw new BadRequestException(error.message);

        const publicUrl = this.supabase.client.storage
          .from('menu-item-images')
          .getPublicUrl(fileName).data.publicUrl;

        return this.prisma.menuItemImage.create({
          data: {
            itemId,
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

  async deleteImages(imageIds: number[]) {
    const images = await this.prisma.menuItemImage.findMany({
      where: { id: { in: imageIds } },
    });

    if (images.length !== imageIds.length) {
      throw new NotFoundException('One or more images not found');
    }

    const { error } = await this.supabase.client.storage
      .from('menu-item-images')
      .remove(images.map((img) => img.path));

    if (error) throw new BadRequestException(error.message);

    await this.prisma.menuItemImage.deleteMany({
      where: {
        id: {
          in: images.map((image) => image.id),
        },
      },
    });

    return {
      message: `${images.length} image(s) deleted successfully`,
    };
  }
}
