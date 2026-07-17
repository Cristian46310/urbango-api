import { resolveCorsOrigins, validateRequiredEnv } from './env.validation';

describe('env.validation', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('validateRequiredEnv', () => {
    it('throws when required vars are missing', () => {
      delete process.env.DB_URL;
      delete process.env.MS_SECURITY_URL;
      delete process.env.MS_SECURITY_INTERNAL_KEY;

      expect(() => validateRequiredEnv()).toThrow(/Missing required/);
    });

    it('passes when all required vars are set', () => {
      process.env.DB_URL = 'postgresql://localhost/db';
      process.env.MS_SECURITY_URL = 'http://localhost:8080';
      process.env.MS_SECURITY_INTERNAL_KEY = 'secret-key-at-least-32-chars!!';

      expect(() => validateRequiredEnv()).not.toThrow();
    });
  });

  describe('resolveCorsOrigins', () => {
    it('returns true in development when unset', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.CORS_ALLOWED_ORIGINS;
      expect(resolveCorsOrigins()).toBe(true);
    });

    it('throws in production when unset', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.CORS_ALLOWED_ORIGINS;
      expect(() => resolveCorsOrigins()).toThrow(/CORS_ALLOWED_ORIGINS/);
    });

    it('parses comma-separated origins', () => {
      process.env.CORS_ALLOWED_ORIGINS =
        'http://localhost:5173, http://localhost:3000';
      expect(resolveCorsOrigins()).toEqual([
        'http://localhost:5173',
        'http://localhost:3000',
      ]);
    });
  });
});
