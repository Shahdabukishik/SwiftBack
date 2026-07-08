import { Module } from '@nestjs/common';
import { MenuItemImagesController } from './menu-item-images.controller';
import { MenuItemImagesService } from './menu-item-images.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [MenuItemImagesController],
  providers: [MenuItemImagesService],
  exports: [MenuItemImagesService],
})
export class MenuItemImagesModule {}
