import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OrderType } from '@prisma/client';
import { CreateOrderItemDto } from './order-item.dto';
import { CUSTOMER_ORDER_TYPES } from '../orders.constants';

export class CreateOrderDto {
  @IsUUID()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  storeId!: string;

  @IsIn(CUSTOMER_ORDER_TYPES)
  @ApiProperty({ example: OrderType.PICKUP, enum: CUSTOMER_ORDER_TYPES })
  type!: (typeof CUSTOMER_ORDER_TYPES)[number];

  @IsString()
  @ApiProperty({ example: '0599999999' })
  phone!: string;

  @ValidateIf((o) => o.type === OrderType.DELIVERY)
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '123 Main St, Apt 4',
    required: false,
    description: 'Required when type is DELIVERY',
  })
  address?: string;

  @ApiProperty({
    example: [
      { menuItemId: '1', quantity: 2 },
      { menuItemId: '2', quantity: 1 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
