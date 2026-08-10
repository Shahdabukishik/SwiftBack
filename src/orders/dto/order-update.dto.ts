import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
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
