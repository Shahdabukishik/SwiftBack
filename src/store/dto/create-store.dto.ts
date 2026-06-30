import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateStoreDto {
    @ApiProperty({
    example: 'My Store',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  images!: string[];

  @ApiProperty({
    example: '123 Main St, City, State 12345',
  })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({
    example: '+1 (555) 123-4567',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;
}