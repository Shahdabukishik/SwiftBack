import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PointsEngineModule } from '../points-engine/points-engine.module';

@Module({
  imports: [PointsEngineModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
