import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Arcium Private Lending API is running! 🔐"', () => {
      expect(appController.getHello()).toBe('Arcium Private Lending API is running! 🔐');
    });
  });

  describe('health', () => {
    it('should return health status', () => {
      const health = appController.getHealth();
      expect(health).toHaveProperty('status', 'healthy');
      expect(health).toHaveProperty('service', 'arcium-private-lending');
      expect(health).toHaveProperty('features');
    });
  });
});
