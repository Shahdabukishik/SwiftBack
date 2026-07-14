import { Module } from '@nestjs/common';
import { PointsTransactionsController } from './points-transactions.controller';
import { PointsTransactionsService } from './points-transactions.service';

@Module({
  controllers: [PointsTransactionsController],
  providers: [PointsTransactionsService],
  exports: [PointsTransactionsService],
})
export class PointsTransactionsModule { }
