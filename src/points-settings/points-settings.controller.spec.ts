import { Test, TestingModule } from '@nestjs/testing';
import { PointsSettingsController } from './points-settings.controller';

describe('PointsSettingsController', () => {
  let controller: PointsSettingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointsSettingsController],
    }).compile();

    controller = module.get<PointsSettingsController>(PointsSettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
