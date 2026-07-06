import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  ValidateNested,
  
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CreateAdvertisementDto {
    
  @ApiProperty({
    example: 'Summer Sale',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'Get up to 50% off on selected items during our summer sale!',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

    @ApiProperty({
    example: '2023-06-01',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: '2023-08-31',
  })
  @IsDateString()
  endDate!: string;

}