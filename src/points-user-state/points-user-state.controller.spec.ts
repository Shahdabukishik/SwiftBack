import { Test, TestingModule } from '@nestjs/testing';
import { PointsUserStateController } from './points-user-state.controller';

describe('PointsUserStateController', () => {
  let controller: PointsUserStateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointsUserStateController],
    }).compile();

    controller = module.get<PointsUserStateController>(PointsUserStateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
