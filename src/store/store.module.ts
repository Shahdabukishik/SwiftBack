import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { StoreImagesModule } from 'src/store-images/store-images.module';

@Module({
  imports: [
    PrismaModule,
    SupabaseModule,
    StoreImagesModule,
  ],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}