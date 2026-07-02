import { Test, TestingModule } from '@nestjs/testing';
import { StoreImagesController } from './store-images.controller';

describe('StoreImagesController', () => {
  let controller: StoreImagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreImagesController],
    }).compile();

    controller = module.get<StoreImagesController>(StoreImagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
