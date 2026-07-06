import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { StoreModule } from './store/store.module';
import { StoreImagesModule } from './store-images/store-images.module';
import { AdvertisementImagesModule } from './advertisement-images/advertisement-images.module';
import { AdvertisementModule } from './advertisement/advertisement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    StoreModule,
    UsersModule,
    PrismaModule,
    StoreImagesModule,
    HealthModule,
    AdvertisementImagesModule,
    AdvertisementModule
  ],
})
export class AppModule {}
