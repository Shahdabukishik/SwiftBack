import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';


export class DeleteAdvertisementImagesDto {
    @ApiProperty({
        example: [
          'e8b8d7b1-7b90-4b1d-a3a8-8a6d2f2b7c91',
          '6d34fd7f-fef8-4d7d-b3db-f8e1b6d85b33',
        ],
      })
      @IsArray()
      @ArrayNotEmpty()
      @IsUUID('4', { each: true })
      imageIds!: string[];
}