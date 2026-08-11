import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class UpdateOrderReadyTimeDto {
  @ApiProperty({
    example: 20,
    description: 'Estimated time in minutes until the order is ready',
  })
  @IsInt()
  @IsPositive()
  estimatedReadyTimeMinutes!: number;
}