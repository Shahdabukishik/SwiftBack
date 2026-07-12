import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditAccountDto {

    @IsOptional()
    @IsString()
    @MaxLength(10)
    @ApiProperty()
    firstName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    @ApiProperty()
    lastName?: string;




}