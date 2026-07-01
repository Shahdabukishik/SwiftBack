import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Patch,
    Req,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadedFiles, UseInterceptors,BadRequestException } from '@nestjs/common';

import {
    ApiBody,
    ApiConsumes,
    ApiBearerAuth,

} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { DeleteStoreImageDto } from './dto/deletestoreImagedto';



@Controller('/v1/stores')
export class StoreController {
    constructor(private readonly storeService: StoreService) { }


    @Post(':storeId/upload-images')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
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
  @UseInterceptors(
  FilesInterceptor('images', 10, {
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
  }),
) 
    uploadImages(
        @Req() req,
        @Param('storeId') id: string,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        return this.storeService.uploadImages(req.user.userId, id, files);
    }


    @Delete(':storeId/images')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    removeImage(
        @Req() req,
        @Param('storeId') id: string,
        @Body() dto: DeleteStoreImageDto,
    ) {
        return this.storeService.removeImage(
            req.user.userId,
            id,
            dto.imageUrl,
        );
    }


    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() dto: CreateStoreDto) {
        return this.storeService.create(dto);
    }

    
    @Get()
    findAll() {
        return this.storeService.findAll();
    }

    
    @Get(':storeId')
    findOne(@Param('storeId') id: string) {
        return this.storeService.findOne(id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete(':storeId')
    remove(@Param('storeId') id: string) {
        return this.storeService.remove(id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Patch(':storeId')
    update(
        @Param('storeId') id: string,
        @Body() dto: UpdateStoreDto,
    ) {
        return this.storeService.update(id, dto);
    }


}