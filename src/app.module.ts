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
import { MenuModule } from './menu/menu.module';
import { MenuCategoriesModule } from './menu-categories/menu-categories.module';
import { MenuItemsModule } from './menu-items/menu-items.module';
import { MenuItemImagesModule } from './menu-item-images/menu-item-images.module';
import { PointsLevelModule } from './points-level/points-level.module';
import { SpinWheelModule } from './spin-wheel/spin-wheel.module';
import { PointsSettingsModule } from './points-settings/points-settings.module';
import { PointsRewardModule } from './points-reward/points-reward.module';
import { PointsUserStateModule } from './points-user-state/points-user-state.module';
import { PointsTransactionsModule } from './points-transactions/points-transactions.module';
import { PointsEngineModule } from './points-engine/points-engine.module';
import { AdjustPointsModule } from './adjust-points/adjust-points.module';
import { PointsRedeemModule } from './points-redeem/points-redeem.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HealthModule,
    AuthModule,
    StoreModule,
    UsersModule,
    PrismaModule,
    StoreImagesModule,
    AdvertisementImagesModule,
    AdvertisementModule,
    MenuModule,
    MenuCategoriesModule,
    MenuItemsModule,
    MenuItemImagesModule,
    PointsLevelModule,
    SpinWheelModule,
    PointsSettingsModule,
    PointsRewardModule,
    PointsUserStateModule,
    PointsTransactionsModule,
    PointsEngineModule,
    AdjustPointsModule,
    PointsRedeemModule,
  ],
})
export class AppModule {}
