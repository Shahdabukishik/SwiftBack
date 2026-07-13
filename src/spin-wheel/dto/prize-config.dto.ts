import { ApiProperty } from '@nestjs/swagger';
import { SpinPrizeType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class PrizeConfigDto {
  @ApiProperty({ required: false, example: 'b2e1c1a0-....' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: '100 نقطة' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  label!: string;

  @ApiProperty({ enum: SpinPrizeType, example: 'points' })
  @IsEnum(SpinPrizeType)
  type!: SpinPrizeType;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  @Max(100)
  probabilityPercent!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  sortOrder!: number;

  @ApiProperty({ required: false, default: true, example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
