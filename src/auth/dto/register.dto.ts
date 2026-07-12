import { IsString, IsDateString, MinLength, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;


  @ApiProperty({
    example: '1990-01-01',
  })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({
    example: 'Password$123',
    minLength: 8,
    maxLength: 64,
  })
   @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=])[A-Za-z\d@$!%*?&^#()_\-+=]+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  password!: string;
}