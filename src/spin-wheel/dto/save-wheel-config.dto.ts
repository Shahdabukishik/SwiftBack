import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsInt, Min, ValidateNested } from 'class-validator';
import { PrizeConfigDto } from './prize-config.dto';

export class SaveWheelConfigDto {
  @ApiProperty({ type: [PrizeConfigDto] })
  @ValidateNested({ each: true })
  @Type(() => PrizeConfigDto)
  @ArrayMinSize(1)
  prizes!: PrizeConfigDto[];

  @ApiProperty({ example: 24 })
  @IsInt()
  @Min(1)
  cooldownHours!: number;
}
