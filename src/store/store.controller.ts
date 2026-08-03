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
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';


@Controller('/v1/stores')
export class StoreController {
    constructor(private readonly storeService: StoreService) { }


    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    @Roles(UserRole.ADMIN)
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
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':storeId')
    @Roles(UserRole.ADMIN)
    remove(@Param('storeId') id: string) {
        return this.storeService.remove(id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':storeId')
    @Roles(UserRole.ADMIN)
    update(
        @Param('storeId') id: string,
        @Body() dto: UpdateStoreDto,
    ) {
        return this.storeService.update(id, dto);
    }


    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':storeId/toggle-status')
    @Roles(UserRole.ADMIN)
    toggleStatus(@Param('storeId') id: string) {
        return this.storeService.toggleStatus(id);
    }
}