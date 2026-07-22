import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignStoreDto {
  @ApiProperty({ example: '3f8d3b2a-6f1a-4b63-8b2a-6a7b5d11f2d', description: 'Store UUID to assign the cashier to' })
  @IsUUID()
  @IsNotEmpty()
  storeId!: string;
}
