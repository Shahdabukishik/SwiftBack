import { Module } from '@nestjs/common';

import { AdvertisementImagesController } from './advertisement-images.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { AdvertisementImagesService } from './advertisement-images.service';

@Module({
  imports: [
    PrismaModule,
    SupabaseModule,
  ],
  controllers: [AdvertisementImagesController],
  providers: [AdvertisementImagesService],
  exports: [AdvertisementImagesService],
})
export class AdvertisementImagesModule {}
