import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { RedeemItemDto } from './redeem-item.dto';

export class RedeemPointsDto {
  @ApiProperty({ example: '3f8d3b2a-6f1a-4b63-8b2a-6a7b5d11f2d', description: 'User UUID to redeem points for' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ type: [RedeemItemDto], description: 'List of rewards to redeem', example: [{ rewardId: '3f8d3b2a-6f1a-4b63-8b2a-6a7b5d11f2d', quantity: 2 }] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RedeemItemDto)
  items!: RedeemItemDto[];
}
