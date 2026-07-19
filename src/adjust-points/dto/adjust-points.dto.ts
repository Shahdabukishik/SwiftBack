import { IsNumber, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import {ApiProperty } from '@nestjs/swagger'

export class AdjustPointsDto {
    
    

    @ApiProperty({
        example:50
    })
    @IsNumber()
    @Min(1)
    points!: number;

    @ApiProperty({
        example:"sdsds"
    })
    @IsString()
    @MaxLength(255)
    reason!: string;
}