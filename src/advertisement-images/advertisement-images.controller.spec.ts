import { Test, TestingModule } from '@nestjs/testing';
import { AdvertisementImagesController } from './advertisement-images.controller';

describe('AdvertisementImagesController', () => {
  let controller: AdvertisementImagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdvertisementImagesController],
    }).compile();

    controller = module.get<AdvertisementImagesController>(AdvertisementImagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
