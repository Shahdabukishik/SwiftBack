import { Type } from 'class-transformer';
import {
  IsNumber,
  IsPositive,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'

export class AddPurchasePointsDto {

    @ApiProperty({
        example:"03ae9f5f-2de5-4b81-924e-8296d4f16bfd"
    })
  @IsUUID()
  userId!: string;


  @ApiProperty({
    example:"100"
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  purchaseAmount!: number;
}