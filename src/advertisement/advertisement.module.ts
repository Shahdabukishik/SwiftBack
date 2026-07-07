import { Module } from '@nestjs/common';
import { AdvertisementController } from './advertisement.controller';
import { AdvertisementService } from './advertisement.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdvertisementImagesModule } from 'src/advertisement-images/advertisement-images.module';

@Module({
  imports: [
    PrismaModule,
    AdvertisementImagesModule,
  ],
  controllers: [AdvertisementController],
  providers: [AdvertisementService],

})
export class AdvertisementModule {}
