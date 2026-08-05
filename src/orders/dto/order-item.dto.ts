import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {

    @ApiProperty({ example: 1 })
    @IsInt()
    @Type(() => Number)
    @Min(1)
    menuItemId!: number;

    @ApiProperty({ example: 2 })
    @IsInt()
    @Type(() => Number)
    @Min(1)
    quantity!: number;
}