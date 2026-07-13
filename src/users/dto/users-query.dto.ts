import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class UsersQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'ADMIN,CASHIER',
    description: 'Comma-separated list of roles to filter by (case-insensitive)',
    enum: UserRole,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((role) => role.trim().toUpperCase())
      : value,
  )
  @IsEnum(UserRole, { each: true })
  role?: UserRole[];
}
