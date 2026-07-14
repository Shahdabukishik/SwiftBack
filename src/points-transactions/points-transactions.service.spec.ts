import { Test, TestingModule } from '@nestjs/testing';
import { PointsTransactionsService } from './points-transactions.service';

describe('PointsTransactionsService', () => {
  let service: PointsTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointsTransactionsService],
    }).compile();

    service = module.get<PointsTransactionsService>(PointsTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
