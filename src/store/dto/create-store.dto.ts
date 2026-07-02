import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

export class WorkingHourDto {
  @IsString()
  day!: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  from?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  to?: string;

  @IsBoolean()
  isClosed!: boolean;
}

export class CreateStoreDto {
    @ApiProperty({
    example: 'My Store',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;


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

  @ApiProperty({
    type: [WorkingHourDto],
    example: [
      { day: 'Monday', from: '09:00', to: '17:00', isClosed: false },
      { day: 'Tuesday', from: '09:00', to: '17:00', isClosed: false },  
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDto)
  workingHours!: WorkingHourDto[];
}