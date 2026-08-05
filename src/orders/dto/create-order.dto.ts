import {
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsOptional,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateOrderItemDto } from './order-item.dto';
import { OrderType } from '@prisma/client';

export class CreateOrderDto {
    @IsUUID()
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    storeId!: string;

    @IsEnum(OrderType)
    @ApiProperty({ example: OrderType.PICKUP })
    type!: OrderType;

    @ApiProperty({
        example: [{ menuItemId: '1', quantity: 2 },
        { menuItemId: '2', quantity: 1 }]
    })

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items!: CreateOrderItemDto[];

}