import { Body, Controller, Delete, Get, Param, Patch, Post, Version } from '@nestjs/common';
import { AdvertisementService } from './advertisement.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';


@ApiTags('Advertisements')
@Controller('advertisements')
export class AdvertisementController {
  constructor(
    private readonly advertisementService: AdvertisementService,
  ) { }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateAdvertisementDto) {
    return this.advertisementService.create(dto);
  }

  @Version('1')
  @Get()
  findAll() {
    return this.advertisementService.findAll();
  }

  @Version('1')
  @Get(':advertisementId')
  findOne(@Param('advertisementId') advertisementId: string) {
    return this.advertisementService.findOne(advertisementId);
  }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Patch(':advertisementId')
  @Roles(UserRole.ADMIN)
  update(
    @Param('advertisementId') id: string,
    @Body() dto: UpdateAdvertisementDto,
  ) {
    return this.advertisementService.update(id, dto);
  }



  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Delete(':advertisementId')
  @Roles(UserRole.ADMIN)
  remove(@Param('advertisementId') id: string) {
    
    return this.advertisementService.remove(id);
  }
}