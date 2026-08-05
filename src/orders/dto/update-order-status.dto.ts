import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
    @ApiProperty({ example: 'IN_PROGRESS , FINISHED ', })
    @IsEnum(OrderStatus)
    status!: OrderStatus;
}