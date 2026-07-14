import { Test, TestingModule } from '@nestjs/testing';
import { PointsRewardService } from './points-reward.service';

describe('PointsRewardService', () => {
  let service: PointsRewardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointsRewardService],
    }).compile();

    service = module.get<PointsRewardService>(PointsRewardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
