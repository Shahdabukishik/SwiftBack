import {
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStoreDto {
  @ApiProperty({
    example: 'My Store',
  })
  @IsOptional()
  @IsString()
  name?: string;


  @ApiProperty({
    example: '123 Main St, Anytown, USA',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: '+1 (555) 123-4567',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}