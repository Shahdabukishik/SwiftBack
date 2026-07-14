import { Test, TestingModule } from '@nestjs/testing';
import { PointsRewardController } from './points-reward.controller';

describe('PointsRewardController', () => {
  let controller: PointsRewardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointsRewardController],
    }).compile();

    controller = module.get<PointsRewardController>(PointsRewardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
