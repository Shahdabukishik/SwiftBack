import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInStoreOrderDto {
  @IsString()
  @ApiProperty({
    example: '0599999999',
    description:
      "Customer's phone number, or their scanned QR value (their user id)",
  })
  customerLookup!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @ApiProperty({ example: 45.5 })
  total!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: '2x Burger, 1x Fries' })
  note?: string;
}
