import { ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { SecurityGuard } from './security.guard';
import { JwtValidationService } from '../services/jwt-validation.service';

describe('SecurityGuard', () => {
  let guard: SecurityGuard;
  const reflector = { getAllAndOverride: jest.fn() };
  const httpService = { post: jest.fn() };
  const configService = {
    get: jest.fn().mockReturnValue('http://localhost:8080'),
  };
  const jwtValidationService = {
    validateToken: jest.fn(),
  };

  const buildContext = (
    headers: Record<string, string> = {},
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          method: 'GET',
          originalUrl: '/api/test',
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  beforeEach(() => {
    guard = new SecurityGuard(
      httpService as unknown as HttpService,
      configService as unknown as ConfigService,
      reflector as unknown as Reflector,
      jwtValidationService as unknown as JwtValidationService,
    );
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockReturnValue(false);
  });

  it('allows public routes without Authorization header', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
  });

  it('throws when Authorization header is missing', async () => {
    await expect(guard.canActivate(buildContext())).rejects.toThrow(
      HttpException,
    );
  });

  it('authorizes when ms-security returns allowed', async () => {
    const jwt = 'header.payload.signature';
    jwtValidationService.validateToken.mockResolvedValue({
      id: 'u1',
      name: 'Test',
      email: 'test@example.com',
      roles: ['ADMIN'],
      createdAt: Date.now(),
    });
    httpService.post.mockReturnValue(of({ data: { allowed: true } }));

    await expect(
      guard.canActivate(buildContext({ authorization: `Bearer ${jwt}` })),
    ).resolves.toBe(true);
  });
});
