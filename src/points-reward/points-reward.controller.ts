import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseUUIDPipe,
    Version,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
    
} from '@nestjs/swagger';
import { PointsRewardsService } from './points-reward.service';
import { CreatePointsRewardDto } from './dto/create-points-reward.dto';
import { UpdatePointsRewardDto } from './dto/update-points-reward.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust path to your auth guard

@ApiTags('Points Rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('points-rewards')
export class PointsRewardsController {
    constructor(private readonly pointsRewardsService: PointsRewardsService) { }

    @Version('1')
    @Post()
    @ApiOperation({ summary: 'Create a new points reward' })
    @ApiResponse({ status: 201, description: 'The reward has been successfully created.' })
    @ApiResponse({ status: 404, description: 'Menu item not found.' })
    @ApiResponse({ status: 409, description: 'Reward already exists for this menu item.' })
    async create(@Body() createPointsRewardDto: CreatePointsRewardDto) {
        return this.pointsRewardsService.create(createPointsRewardDto);
    }

    @Version('1')
    @Get()
    @ApiOperation({ summary: 'Retrieve all points rewards' })
    @ApiResponse({ status: 200, description: 'List of all points rewards ordered by menu item name.' })
    async findAll() {
        return this.pointsRewardsService.findAll();
    }

    @Version('1')
    @Get(':pointsRewardId')
    @ApiOperation({ summary: 'Retrieve a single points reward by ID' })
    @ApiResponse({ status: 200, description: 'The points reward details.' })
    @ApiResponse({ status: 404, description: 'Points reward not found.' })
    async findOne(@Param('pointsRewardId', ParseUUIDPipe) id: string) {
        return this.pointsRewardsService.findOne(id);
    }

    @Version('1')
    @Patch(':pointsRewardId')
    @ApiOperation({ summary: 'Update an existing points reward' })
    @ApiResponse({ status: 200, description: 'The reward has been successfully updated.' })
    @ApiResponse({ status: 404, description: 'Points reward or target menu item not found.' })
    @ApiResponse({ status: 409, description: 'Reward already exists for this menu item.' })
    async update(
        @Param('pointsRewardId', ParseUUIDPipe) id: string,
        @Body() updatePointsRewardDto: UpdatePointsRewardDto,
    ) {
        return this.pointsRewardsService.update(id, updatePointsRewardDto);
    }

    @Version('1')
    @Delete(':pointsRewardId')
    @ApiOperation({ summary: 'Delete a points reward' })
    @ApiResponse({ status: 200, description: 'Points reward successfully deleted.' })
    @ApiResponse({ status: 404, description: 'Points reward not found.' })
    async remove(@Param('pointsRewardId', ParseUUIDPipe) id: string) {
        return this.pointsRewardsService.remove(id);
    }
}