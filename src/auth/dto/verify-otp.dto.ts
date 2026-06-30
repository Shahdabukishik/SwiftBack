import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: '0599999999',
  })
  @IsString()
  phone!: string;

  @ApiProperty({
    example: '0000',
  })
  @IsString()
  @Length(4, 4)
  otp!: string;
}
