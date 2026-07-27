import { Body, Controller, Get, Post, Put, Req, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SpinWheelService } from './spin-wheel.service';
import { SaveWheelConfigDto } from './dto/save-wheel-config.dto';
import { UserRole } from 'src/users/enums/user-role.enum';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('Spin Wheel')

@Controller('spin-wheel')
export class SpinWheelController {
  constructor(private readonly spinWheelService: SpinWheelService) { }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Get('config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get wheel config (admin)' })
  @ApiResponse({ status: 200, description: 'Wheel config returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getConfig() {
    return this.spinWheelService.getConfig();
  }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Put('config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Save wheel config (admin)' })
  @ApiResponse({ status: 200, description: 'Wheel config saved successfully' })
  @ApiResponse({ status: 400, description: 'Prize probabilities must sum to 100%' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async saveConfig(@Body() dto: SaveWheelConfigDto, @Req() req) {
    return this.spinWheelService.saveConfig(dto, req.user.userId);
  }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get wheel (customer)' })
  @ApiResponse({ status: 200, description: 'Wheel returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWheel(@Req() req) {
    return this.spinWheelService.getWheel(req.user.userId);
  }

  @Version('1')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('spin')
  @ApiOperation({ summary: 'Spin the wheel (customer)' })
  @ApiResponse({ status: 200, description: 'Spin result returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Cooldown not elapsed' })
  async spin(@Req() req) {
    return this.spinWheelService.spin(req.user.userId);
  }
}
