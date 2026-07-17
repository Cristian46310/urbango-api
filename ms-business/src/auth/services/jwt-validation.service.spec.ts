import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { JwtValidationService } from './jwt-validation.service';

describe('JwtValidationService', () => {
  let service: JwtValidationService;
  let httpService: { post: jest.Mock };

  beforeEach(async () => {
    httpService = {
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtValidationService,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:8080'),
          },
        },
      ],
    }).compile();

    service = module.get(JwtValidationService);
    jest.clearAllMocks();
  });

  it('returns JwtPayload when ms-security validates token', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          id: 'user-1',
          name: 'Test',
          email: 'test@example.com',
          roles: ['DRIVER'],
        },
      }),
    );

    const payload = await service.validateToken('token');
    expect(payload.id).toBe('user-1');
    expect(payload.roles).toEqual(['DRIVER']);
  });

  it('reuses cached payload within TTL', async () => {
    httpService.post.mockReturnValue(
      of({
        data: {
          id: 'user-1',
          name: 'Test',
          email: 'test@example.com',
          roles: ['DRIVER'],
        },
      }),
    );

    await service.validateToken('same-token');
    await service.validateToken('same-token');

    expect(httpService.post).toHaveBeenCalledTimes(1);
  });

  it('throws HttpException when validation fails', async () => {
    httpService.post.mockReturnValue(throwError(() => new Error('network')));
    await expect(service.validateToken('bad')).rejects.toThrow(HttpException);
  });
});
