import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class WorkingHourDto {
  @ApiProperty({ example: 'Monday' })
  @IsString()
  day!: string;

  @ApiProperty({ example: '09:00', required: false })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  from?: string;

  @ApiProperty({ example: '17:00', required: false })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  to?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isClosed!: boolean;
}

export class UpdateStoreDto {
  @ApiProperty({ example: 'My Store', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '123 Main St, Anytown, USA', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '+1 (555) 123-4567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    type: [WorkingHourDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDto)
  workingHours?: WorkingHourDto[];
}