import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import axios from 'axios';
import { JwtValidationService } from './jwt-validation.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('JwtValidationService', () => {
  let service: JwtValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtValidationService,
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
    mockedAxios.post.mockResolvedValue({
      data: {
        id: 'user-1',
        name: 'Test',
        email: 'test@example.com',
        roles: ['DRIVER'],
      },
    });

    const payload = await service.validateToken('token');
    expect(payload.id).toBe('user-1');
    expect(payload.roles).toEqual(['DRIVER']);
  });

  it('throws HttpException when validation fails', async () => {
    mockedAxios.post.mockRejectedValue(new Error('network'));
    await expect(service.validateToken('bad')).rejects.toThrow(HttpException);
  });
});
