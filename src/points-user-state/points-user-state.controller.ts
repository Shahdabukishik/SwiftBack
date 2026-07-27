import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PointsUserStateService } from './points-user-state.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path to your AuthGuard
import { PaginationDto } from '../common/dto/pagination.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';

@ApiTags('Points User State')
@Controller('points-user-state')
export class PointsUserStateController {
  constructor(
    private readonly pointsUserStateService: PointsUserStateService,
  ) { }


  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Version('1')
  @Get('me')
  @ApiOperation({ summary: "Return the authenticated user's points information." })
  @ApiResponse({
    status: 200,
    description: "Returns the current user's state or a default structure if not found.",
  })
  async getMyPointsState(@Request() req) {
    return this.pointsUserStateService.getUserState(req.user.userId);
  }


  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Version('1')
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Return all user states, paginated and ordered by highest balance.' })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of all points user states.',
  })
  async getAllUserStates(@Query() paginationDto: PaginationDto) {
    // Relying on PaginationDto structure to dynamically generate Swagger query forms via class-validator/transformer if configured, 
    // or through structural inference.
    return this.pointsUserStateService.getPaginatedStates(paginationDto);
  }


  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Version('1')
  @Get(':userId')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @ApiOperation({ summary: "Admin/Cashier helper: Return a specific user's points state." })
  @ApiResponse({
    status: 200,
    description: "Returns the specified user's state or a default structure if not found.",
  })
  async getUserPointsState(@Param('userId') userId: string) {
    return this.pointsUserStateService.getUserState(userId);
  }
}