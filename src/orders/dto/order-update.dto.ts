import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { CUSTOMER_ORDER_TYPES } from '../orders.constants';

export class OrderItemQuantityUpdateDto {
  @IsUUID()
  @ApiPropertyOptional()
  id!: string;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @ApiPropertyOptional()
  quantity!: number;
}

export class OrderUpdateDto {
  // Admin only.
  @IsOptional()
  @IsEnum(OrderStatus)
  @ApiPropertyOptional({ enum: OrderStatus })
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional()
  note?: string;

  // Admin only — cashiers cannot set this directly. Recalculated
  // automatically (ignored if sent) whenever `items` is also present.
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @ApiPropertyOptional()
  total?: number;

  // Switching to DELIVERY requires an address (either sent alongside this,
  // or already on the order). Switching to PICKUP clears any address.
  // Recalculates deliveryFee and total automatically.
  @IsOptional()
  @IsIn(CUSTOMER_ORDER_TYPES)
  @ApiPropertyOptional({ enum: CUSTOMER_ORDER_TYPES })
  type?: (typeof CUSTOMER_ORDER_TYPES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional()
  address?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  phone?: string;

  // Quantity edits for existing items on this order. Recalculates that
  // item's totalPrice and the order's total automatically.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemQuantityUpdateDto)
  @ApiPropertyOptional({ type: [OrderItemQuantityUpdateDto] })
  items?: OrderItemQuantityUpdateDto[];
}
