import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MenuItemsService } from './menu-items.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuItemsQueryDto } from './dto/menu-items-query.dto';

@ApiTags('Menu Items')
@Controller('menu/items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Version('1')
  @Get()
  findAll(@Query() query: MenuItemsQueryDto) {
    return this.menuItemsService.findAll(query);
  }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateMenuItemDto, @Req() req) {
    return this.menuItemsService.create(dto, req.user.userId);
  }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':itemId')
  update(
    @Param('itemId', ParseIntPipe) id: number,
    @Body() dto: UpdateMenuItemDto,
    @Req() req,
  ) {
    return this.menuItemsService.update(id, dto, req.user.userId);
  }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':itemId')
  remove(@Param('itemId', ParseIntPipe) id: number) {
    return this.menuItemsService.remove(id);
  }
}
