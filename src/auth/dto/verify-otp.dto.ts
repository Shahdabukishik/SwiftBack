import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length , IsEnum } from 'class-validator';
import { OtpPurpose } from '@prisma/client';

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

  @ApiProperty({
    example: 'FORGOT_PASSWORD',
  })
  @IsEnum(OtpPurpose)
  purpose!: OtpPurpose;
  
}

