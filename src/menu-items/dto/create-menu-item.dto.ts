import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  categoryId!: number;

  @ApiProperty({ example: 'Chicken Sandwich' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example:
      'Grilled chicken shawarma wrapped with fresh vegetables, pickles, and creamy garlic sauce.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 15.0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
