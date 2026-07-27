import { Controller, Version, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UseGuards, Post, Body,  } from '@nestjs/common';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { AdjustPointsService } from './adjust-points.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { AddPurchasePointsDto } from './dto/add-purchase-points.dto';

@ApiTags('Add Points')
@Controller('add-points')
export class AdjustPointsController {

    constructor(
        private readonly adjustPointsService: AdjustPointsService,
    ) { }

    @Version('1')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    @Roles(UserRole.ADMIN, UserRole.CASHIER)
    async addPoints(
        @Body() dto: AddPurchasePointsDto,
        @Req() req: any,
    ) {
        return this.adjustPointsService.addPoints(
            dto,
            req.user.userId,
        );
    }
}


