import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class RedeemItemDto {
  @ApiProperty({ example: '3f8d3b2a-6f1a-4b63-8b2a-6a7b5d11f2d', description: 'Reward UUID to redeem' })
  @IsUUID()
  @IsNotEmpty()
  rewardId!: string;

  @ApiProperty({ example: 2, minimum: 1, description: 'Quantity of the reward to redeem' })
  @IsInt()
  @Min(1)
  quantity!: number;
}
