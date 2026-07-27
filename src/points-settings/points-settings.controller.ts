import { Body, Controller, Get, Patch, Req, UseGuards, Version } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PointsSettingsService } from './points-settings.service';
import { UpdatePointsSettingsDto } from './dto/update-points-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path to your auth guard
import { Request } from 'express';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';


// Interface to type the modified request object from the JwtAuthGuard
interface RequestWithUser extends Request {
  user: {
    userId: string;
    [key: string]: any;
  };
}

@ApiTags('Points Settings')

@Controller('points-settings')
export class PointsSettingsController {
  constructor(private readonly pointsSettingsService: PointsSettingsService) { }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Version('1')
  @Get()
  @ApiOperation({
    summary: 'Get system points settings',
    description: 'Returns the singleton points settings record. Creates defaults if it does not exist.',
  })
  @ApiResponse({ status: 200, description: 'The current points settings.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getSettings() {
    return this.pointsSettingsService.getSettings();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Version('1')
  @Patch()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update system points settings',
    description: 'Updates specific fields in the points settings singleton record.',
  })
  @ApiResponse({
    status: 200,
    description: 'The points settings have been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateSettings(
    @Req() req: RequestWithUser,
    @Body() updatePointsSettingsDto: UpdatePointsSettingsDto,
  ) {
    const userId = req.user.userId;
    return this.pointsSettingsService.updateSettings(
      userId,
      updatePointsSettingsDto,
    );
  }
}