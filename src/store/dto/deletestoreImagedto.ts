
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';


export class DeleteStoreImageDto {
     @ApiProperty({
        example: 'https://xzgtsfnicivbeqhqzydp.supabase.co/storage/v1/object/public/store-images/1782817713764-Screenshot%202025-11-30%20174354.png',
      })
      @IsString()
      @IsNotEmpty()
  imageUrl!: string;
}