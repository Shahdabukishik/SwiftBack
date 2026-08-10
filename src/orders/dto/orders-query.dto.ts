import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus, OrderType } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class OrdersQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  @ApiPropertyOptional({ enum: OrderStatus })
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(OrderType)
  @ApiPropertyOptional({ enum: OrderType })
  type?: OrderType;

  // Admin only — a cashier's effective storeId is always their own
  // assigned store and overrides anything passed here.
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  storeId?: string;
}
