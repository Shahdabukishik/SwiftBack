// dto/send-otp.dto.ts

import { IsEnum, IsString } from 'class-validator';
import { OtpPurpose } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger'

export class SendOtpDto {

    @ApiProperty({
        example: '0594347237'
    })
    @IsString()
    phone!: string;

    @ApiProperty({
        example: 'REGISTER'
    })
    @IsEnum(OtpPurpose)
    purpose!: OtpPurpose;
}