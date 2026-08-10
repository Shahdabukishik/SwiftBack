import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus, OrderType } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class AdminOrdersQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  @ApiPropertyOptional({ enum: OrderStatus })
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(OrderType)
  @ApiPropertyOptional({ enum: OrderType })
  type?: OrderType;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  storeId?: string;
}
