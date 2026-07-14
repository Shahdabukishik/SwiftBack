import { Body, Controller, Get, Post, Put, Req, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SpinWheelService } from './spin-wheel.service';
import { SaveWheelConfigDto } from './dto/save-wheel-config.dto';

@ApiTags('Spin Wheel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('spin-wheel')
export class SpinWheelController {
  constructor(private readonly spinWheelService: SpinWheelService) {}

  @Version('1')
  @Get('config')
  @ApiOperation({ summary: 'Get wheel config (admin)' })
  @ApiResponse({ status: 200, description: 'Wheel config returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getConfig() {
    return this.spinWheelService.getConfig();
  }

  @Version('1')
  @Put('config')
  @ApiOperation({ summary: 'Save wheel config (admin)' })
  @ApiResponse({ status: 200, description: 'Wheel config saved successfully' })
  @ApiResponse({ status: 400, description: 'Prize probabilities must sum to 100%' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async saveConfig(@Body() dto: SaveWheelConfigDto, @Req() req) {
    return this.spinWheelService.saveConfig(dto, req.user.userId);
  }

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'Get wheel (customer)' })
  @ApiResponse({ status: 200, description: 'Wheel returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWheel(@Req() req) {
    return this.spinWheelService.getWheel(req.user.userId);
  }

  @Version('1')
  @Post('spin')
  @ApiOperation({ summary: 'Spin the wheel (customer)' })
  @ApiResponse({ status: 200, description: 'Spin result returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Cooldown not elapsed' })
  async spin(@Req() req) {
    return this.spinWheelService.spin(req.user.userId);
  }
}
