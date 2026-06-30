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
import { UploadedFiles, UseInterceptors } from '@nestjs/common';
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


    @Post(':id/upload-images')
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
    @UseInterceptors(FilesInterceptor('images', 10)) // max 10 images
    uploadImages(
        @Req() req,
        @Param('id') id: string,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        return this.storeService.uploadImages(req.user.userId, id, files);
    }


    @Delete(':id/images')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    removeImage(
        @Req() req,
        @Param('id') id: string,
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

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get()
    findAll() {
        return this.storeService.findAll();
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.storeService.findOne(id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.storeService.remove(id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateStoreDto,
    ) {
        return this.storeService.update(id, dto);
    }


}