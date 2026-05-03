import { Test, TestingModule } from '@nestjs/testing';
import { StopController } from './stop.controller';
import { StopService } from './stop.service';

describe('StopController', () => {
  let controller: StopController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StopController],
      providers: [StopService],
    }).compile();

    controller = module.get<StopController>(StopController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
