import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
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

@ApiTags('Points User State')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('points-user-state')
export class PointsUserStateController {
  constructor(
    private readonly pointsUserStateService: PointsUserStateService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: "Return the authenticated user's points information." })
  @ApiResponse({
    status: 200,
    description: "Returns the current user's state or a default structure if not found.",
  })
  async getMyPointsState(@Request() req) {
    return this.pointsUserStateService.getUserState(req.user.userId);
  }

  @Get()
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

  @Get(':userId')
  @ApiOperation({ summary: "Admin/Cashier helper: Return a specific user's points state." })
  @ApiResponse({
    status: 200,
    description: "Returns the specified user's state or a default structure if not found.",
  })
  async getUserPointsState(@Param('userId') userId: string) {
    return this.pointsUserStateService.getUserState(userId);
  }
}