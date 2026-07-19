import { Test, TestingModule } from '@nestjs/testing';
import { AdjustPointsController } from './adjust-points.controller';

describe('AdjustPointsController', () => {
  let controller: AdjustPointsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdjustPointsController],
    }).compile();

    controller = module.get<AdjustPointsController>(AdjustPointsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
