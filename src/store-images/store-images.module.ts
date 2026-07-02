import { Module } from '@nestjs/common';
import { StoreImagesController } from './store-images.controller';
import { StoreImagesService } from './store-images.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [
    PrismaModule,
    SupabaseModule,
  ],
  controllers: [StoreImagesController],
  providers: [StoreImagesService]
})
export class StoreImagesModule {}
