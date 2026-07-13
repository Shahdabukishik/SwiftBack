import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  Min,
  IsInt,
  IsPositive,
} from 'class-validator';

export class CreatePointsLevelDto {
  @ApiProperty({
    description: 'The name of the loyalty level',
    example: 'Silver',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @ApiProperty({
    description: 'Minimum points required in the period to reach this level',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  minPeriodPoints!: number;

  @ApiProperty({
    description: 'Points earn rate multiplier for this level',
    example: 2.0,
    minimum: 0.0001,
  })
  @IsNumber()
  @IsPositive()
  earnRate!: number;

  @ApiProperty({
    description: 'Order of the level for display purposes',
    example: 2,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  sortOrder!: number;
}