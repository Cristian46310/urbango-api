import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IncidentStorageService } from './incident-storage.service';

describe('IncidentStorageService', () => {
  let service: IncidentStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SUPABASE_URL') return undefined;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(IncidentStorageService);
  });

  it('uploadMany returns empty array when no files', async () => {
    await expect(service.uploadMany([])).resolves.toEqual([]);
  });
});
