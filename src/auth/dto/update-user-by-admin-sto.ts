import { UserRole } from "src/users/enums/user-role.enum";
import { IsEnum, IsOptional, IsString, IsDateString, MinLength, MaxLength, Matches } from "class-validator";
import { ApiProperty } from '@nestjs/swagger'

export class UpdateUserByAdminDto {
      @ApiProperty({
        example:'CASHIER'
    })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @ApiProperty()
    @IsString()
    @IsOptional()
    firstName!: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    lastName!: string;

    @ApiProperty({
        example: '0599999999',
    })
    @IsString()
    @IsOptional()
    phone!: string;

    @ApiProperty({
        example: '1990-01-01',
    })
    @IsDateString()
    @IsOptional()
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
    @IsOptional()
    password!: string;
}