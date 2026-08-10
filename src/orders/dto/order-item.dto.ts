import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
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

  @ApiProperty({ example: 'no onions', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
