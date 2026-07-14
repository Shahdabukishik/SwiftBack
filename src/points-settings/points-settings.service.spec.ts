import { Test, TestingModule } from '@nestjs/testing';
import { PointsSettingsService } from './points-settings.service';

describe('PointsSettingsService', () => {
  let service: PointsSettingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointsSettingsService],
    }).compile();

    service = module.get<PointsSettingsService>(PointsSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
