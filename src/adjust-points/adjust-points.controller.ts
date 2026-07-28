import { Controller, Version, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UseGuards, Post, Body, Delete } from '@nestjs/common';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { AdjustPointsService } from './adjust-points.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { AddPurchasePointsDto } from './dto/add-purchase-points.dto';

@ApiBearerAuth()
@ApiTags('Add Points')
@Controller()
export class AdjustPointsController {

    constructor(
        private readonly adjustPointsService: AdjustPointsService,
    ) { }

    @Version('1')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('PurchasePoints')
    @Roles(UserRole.ADMIN, UserRole.CASHIER)
    async addPurchase(
        @Body() dto: AddPurchasePointsDto,
        @Req() req: any,
    ) {
        return this.adjustPointsService.addPurchase(
            dto,
            req.user.userId,
        );
    }

    @Version('1')
    @Post('addPoints')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async addPoints(
        @Body() dto: AdjustPointsDto,
        @Req() req: any,
    ) {
        return this.adjustPointsService.addPoints(dto, req.user.userId);
    }

    @Version('1')
    @Delete('removePoint')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async removePoints(
        @Body() dto: AdjustPointsDto,
        @Req() req: any,
    ) {
        return this.adjustPointsService.removePoints(dto, req.user.userId);
    }
}


