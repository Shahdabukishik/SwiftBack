import { Test, TestingModule } from '@nestjs/testing';
import { StoreImagesService } from './store-images.service';

describe('StoreImagesService', () => {
  let service: StoreImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoreImagesService],
    }).compile();

    service = module.get<StoreImagesService>(StoreImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
