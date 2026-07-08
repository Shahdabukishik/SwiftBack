import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class MenuItemsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by category' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;
}
