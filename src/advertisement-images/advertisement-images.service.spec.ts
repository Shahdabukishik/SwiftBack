import { Test, TestingModule } from '@nestjs/testing';
import { AdvertisementImagesService } from './advertisement-images.service';

describe('AdvertisementImagesService', () => {
  let service: AdvertisementImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdvertisementImagesService],
    }).compile();

    service = module.get<AdvertisementImagesService>(AdvertisementImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
