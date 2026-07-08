import { Module } from '@nestjs/common';
import { MenuItemsController } from './menu-items.controller';
import { MenuItemsService } from './menu-items.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MenuItemImagesModule } from 'src/menu-item-images/menu-item-images.module';

@Module({
  imports: [PrismaModule, MenuItemImagesModule],
  controllers: [MenuItemsController],
  providers: [MenuItemsService],
  exports: [MenuItemsService],
})
export class MenuItemsModule {}
