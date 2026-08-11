import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderReportService } from './order-report.service';
import { PointsEngineModule } from '../points-engine/points-engine.module';

@Module({
  imports: [PointsEngineModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderReportService],
})
export class OrdersModule {}
