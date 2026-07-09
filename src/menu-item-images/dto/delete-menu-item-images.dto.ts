import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class DeleteMenuItemImagesDto {
  @ApiProperty({ example: [1, 2] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  imageIds!: number[];
}
