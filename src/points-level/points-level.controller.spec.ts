import { Test, TestingModule } from '@nestjs/testing';
import { PointsLevelController } from './points-level.controller';

describe('PointsLevelController', () => {
  let controller: PointsLevelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointsLevelController],
    }).compile();

    controller = module.get<PointsLevelController>(PointsLevelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
