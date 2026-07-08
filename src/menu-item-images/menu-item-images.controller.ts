import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MenuItemImagesService } from './menu-item-images.service';
import { DeleteMenuItemImagesDto } from './dto/delete-menu-item-images.dto';

@Controller('menu-item-images')
export class MenuItemImagesController {
  constructor(
    private readonly menuItemImagesService: MenuItemImagesService,
  ) {}

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
  @Post(':itemId')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
        files: 10,
      },
      fileFilter: (req, file, cb) => {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(
            file.mimetype,
          )
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
    @Param('itemId', ParseIntPipe) itemId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.menuItemImagesService.uploadImages(itemId, files);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Version('1')
  @Delete(':imagesId')
  deleteImages(@Body() dto: DeleteMenuItemImagesDto) {
    return this.menuItemImagesService.deleteImages(dto.imageIds);
  }
}
