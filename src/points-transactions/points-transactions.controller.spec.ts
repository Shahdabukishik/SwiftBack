import { Test, TestingModule } from '@nestjs/testing';
import { PointsTransactionsController } from './points-transactions.controller';

describe('PointsTransactionsController', () => {
  let controller: PointsTransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointsTransactionsController],
    }).compile();

    controller = module.get<PointsTransactionsController>(PointsTransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
