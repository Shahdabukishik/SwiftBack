import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
      example: '4580',
    })
  @IsString()
  resetToken!: string;

  @ApiProperty({
      example: 'newPassword123456',
    })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
  