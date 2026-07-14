import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive, Min } from 'class-validator';

export class CreatePointsRewardDto {
  @ApiProperty({
    description: 'The ID of the menu item to be redeemed',
    example: 12,
  })
  @IsInt()
  @Min(1)
  menuItemId!: number;

  @ApiProperty({
    description: 'The number of points required to redeem this menu item',
    example: 350.0,
  })
  @IsNumber()
  @IsPositive()
  pointsRequired!: number;
}