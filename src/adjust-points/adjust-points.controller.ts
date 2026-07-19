import { Controller, Version, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UseGuards, Post, Body, Request } from '@nestjs/common';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { AdjustPointsService } from './adjust-points.service';

@ApiTags('Admin Points')
@Controller('adjust-points')
export class AdjustPointsController {

    constructor(
        private readonly adjustPointsService: AdjustPointsService,
    ) { }

    @Version('1')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('users/:userId/add')
    @ApiOperation({ summary: 'Add points to a user' })
    async addPoints(
        @Param('userId', ParseUUIDPipe) userId: string,
        @Body() dto: AdjustPointsDto,
        @Req() req,
    ) {
        
        return this.adjustPointsService.addPoints(
            userId,
            dto,
            req.user.userId,
        );
    }
}


