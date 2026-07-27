import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'

export class ConfirmDobDto {

  @ApiProperty({
    example:'1990-01-01'
  })
  @IsDateString()
  dateOfBirth!: string;
}