import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PointsLevelService } from './points-level.service';
import { CreatePointsLevelDto } from './dto/create-points-level.dto';
import { UpdatePointsLevelDto } from './dto/update-points-level.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path to your JWT Guard

@ApiTags('points levels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('points-levels')
export class PointsLevelController {
  constructor(private readonly pointsLevelService: PointsLevelService) {}

  @Version('1')
  @Post()
  @ApiOperation({ summary: 'Create a new loyalty level' })
  @ApiResponse({
    status: 201,
    description: 'The loyalty level has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(
    @Body() createPointsLevelDto: CreatePointsLevelDto,
    @Req() req: any,
  ) {
    return await this.pointsLevelService.create(
      createPointsLevelDto,
      req.user.userId,
    );
  }

  @Version('1')
  @Get()
  @ApiOperation({ summary: 'Retrieve all loyalty levels ordered by sortOrder' })
  @ApiResponse({
    status: 200,
    description: 'List of all loyalty levels.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll() {
    return await this.pointsLevelService.findAll();
  }

  @Version('1')
  @Get(':pointsLevelId')
  @ApiOperation({ summary: 'Retrieve a specific loyalty level by ID' })
  @ApiResponse({
    status: 200,
    description: 'The requested loyalty level.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Points level not found.' })
  async findOne(@Param('pointsLevelId') id: string) {
    return await this.pointsLevelService.findOne(id);
  }

  @Version('1')
  @Patch(':pointsLevelId')
  @ApiOperation({ summary: 'Update a specific loyalty level' })
  @ApiResponse({
    status: 200,
    description: 'The loyalty level has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Points level not found.' })
  async update(
    @Param('pointsLevelId') id: string,
    @Body() updatePointsLevelDto: UpdatePointsLevelDto,
    @Req() req: any,
  ) {
    return await this.pointsLevelService.update(
      id,
      updatePointsLevelDto,
      req.user.userId,
    );
  }

  @Version('1')
  @Delete(':pointsLevelId')
  @ApiOperation({ summary: 'Delete a specific loyalty level' })
  @ApiResponse({
    status: 200,
    description: 'The loyalty level has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Points level not found.' })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete a loyalty level currently assigned to users.',
  })
  async remove(@Param('pointsLevelId') id: string) {
    return await this.pointsLevelService.remove(id);
  }
}