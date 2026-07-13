import { Test, TestingModule } from '@nestjs/testing';
import { PointsLevelService } from './points-level.service';

describe('PointsLevelService', () => {
  let service: PointsLevelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointsLevelService],
    }).compile();

    service = module.get<PointsLevelService>(PointsLevelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
