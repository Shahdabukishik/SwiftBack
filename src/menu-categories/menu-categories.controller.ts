import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MenuCategoriesService } from './menu-categories.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';

@ApiTags('Menu Categories')
@Controller('menu/categories')
export class MenuCategoriesController {
  constructor(
    private readonly menuCategoriesService: MenuCategoriesService,
  ) {}

  @Version('1')
  @Get()
  findAll() {
    return this.menuCategoriesService.findAll();
  }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateMenuCategoryDto, @Req() req) {
    return this.menuCategoriesService.create(dto, req.user.userId);
  }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuCategoryDto,
    @Req() req,
  ) {
    return this.menuCategoriesService.update(id, dto, req.user.userId);
  }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menuCategoriesService.remove(id);
  }
}
