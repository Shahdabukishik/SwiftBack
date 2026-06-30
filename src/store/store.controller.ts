import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Patch,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import {
    ApiBody,
    ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';



@Controller('/v1/stores')
export class StoreController {
    constructor(private readonly storeService: StoreService) { }


    @UseGuards(JwtAuthGuard)
    @Post("upload")
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                image: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor("image"))
    upload(
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.storeService.upload(file);
    }


    @Post()
    create(@Body() dto: CreateStoreDto) {
        return this.storeService.create(dto);
    }

    @Get()
    findAll() {
        return this.storeService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.storeService.findOne(id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.storeService.remove(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateStoreDto,
    ) {
        return this.storeService.update(id, dto);
    }
}