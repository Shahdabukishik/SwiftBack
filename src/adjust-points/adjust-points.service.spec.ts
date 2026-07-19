import { Test, TestingModule } from '@nestjs/testing';
import { AdjustPointsService } from './adjust-points.service';

describe('AdjustPointsService', () => {
  let service: AdjustPointsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdjustPointsService],
    }).compile();

    service = module.get<AdjustPointsService>(AdjustPointsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
