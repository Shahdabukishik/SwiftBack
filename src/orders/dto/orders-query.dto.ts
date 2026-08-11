import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { OrderStatus, OrderType } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

// Accepts a single value, comma-separated values (?status=A,B), or repeated
// query keys (?status=A&status=B — Express already arrays these) and
// normalizes all three into a single array.
function toArray({ value }: TransformFnParams): unknown[] | undefined {
  const raw: unknown = value;

  if (raw === undefined) {
    return undefined;
  }

  const values: unknown[] = Array.isArray(raw) ? raw : [raw];

  return values.flatMap((v) => (typeof v === 'string' ? v.split(',') : v));
}

export class OrdersQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(OrderStatus, { each: true })
  @ApiPropertyOptional({
    enum: OrderStatus,
    isArray: true,
    description:
      'One or more statuses — comma-separated (status=CONFIRMED,IN_PROGRESS) or repeated (status=CONFIRMED&status=IN_PROGRESS)',
  })
  status?: OrderStatus[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(OrderType, { each: true })
  @ApiPropertyOptional({
    enum: OrderType,
    isArray: true,
    description:
      'One or more types — comma-separated (type=PICKUP,DELIVERY) or repeated (type=PICKUP&type=DELIVERY)',
  })
  type?: OrderType[];

  // Admin only — a cashier's effective storeId is always their own
  // assigned store and overrides anything passed here.
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional()
  storeId?: string;

  // Filters orders created on/after this date (whole day, server-local).
  // A cashier's 3-day history cap still applies on top of this.
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Filter orders created on/after this date (YYYY-MM-DD)',
  })
  from?: string;

  // Filters orders created on/before this date (whole day, server-local).
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({
    example: '2026-08-11',
    description: 'Filter orders created on/before this date (YYYY-MM-DD)',
  })
  to?: string;
}
