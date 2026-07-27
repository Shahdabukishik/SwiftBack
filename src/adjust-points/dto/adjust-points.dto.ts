import { IsNumber, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'

export class AdjustPointsDto {
    @ApiProperty({
        description: 'ID of the user who will receive the points',
        format: 'uuid',
    })
    @IsUUID()
    userId!: string;


    @ApiProperty({
        example: 50
    })
    @IsNumber()
    @Min(1)
    points!: number;

    @ApiProperty({
        example: "sdsds"
    })
    @IsString()
    @MaxLength(255)
    reason!: string;
}