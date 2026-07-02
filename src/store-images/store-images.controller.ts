import { Controller } from '@nestjs/common';
import { Post, Param, UploadedFiles, UseInterceptors, Delete, Version, Body } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StoreImagesService } from './store-images.service';
import { ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { DeleteStoreImagesDto } from './dto/delete-storeImages.dto';



@Controller('store-images')
export class StoreImagesController {
    constructor(private readonly storeImagesService: StoreImagesService) { }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Version('1')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                images: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        },
    })
    @Post(':storeId')
    @UseInterceptors(FilesInterceptor('images', 10, {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5 MB
            files: 10,
        },
        fileFilter: (req, file, cb) => {
            if (
                ![
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                ].includes(file.mimetype)
            ) {
                return cb(
                    new BadRequestException(
                        'Only JPG, PNG and WEBP images are allowed',
                    ),
                    false,
                );
            }

            cb(null, true);
        },
    }),)
    uploadImages(
        @Param('storeId') storeId: string,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        return this.storeImagesService.uploadImages(storeId, files);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Version('1')
    @Delete(':imagesId')
    deleteImages(
        @Body() dto: DeleteStoreImagesDto,
    ) {
        return this.storeImagesService.deleteImages(dto.imageIds);
    }
}
