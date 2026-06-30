import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    PrismaModule,
    SupabaseModule,
  ],
  controllers: [StoreController],
  providers: [StoreService],
})
export class StoreModule {}