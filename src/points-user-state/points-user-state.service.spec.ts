import { Test, TestingModule } from '@nestjs/testing';
import { PointsUserStateService } from './points-user-state.service';

describe('PointsUserStateService', () => {
  let service: PointsUserStateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointsUserStateService],
    }).compile();

    service = module.get<PointsUserStateService>(PointsUserStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
