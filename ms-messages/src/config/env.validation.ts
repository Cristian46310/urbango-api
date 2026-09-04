/**
 * Fail-fast env validation for ms-messages.
 * Call once at bootstrap before NestFactory.create.
 */
export function validateRequiredEnv(): void {
  const required = [
    'DB_URL',
    'MS_SECURITY_URL',
    'MS_SECURITY_INTERNAL_KEY',
  ] as const;

  const missing = required.filter((key) => {
    const value = process.env[key]?.trim();
    return !value;
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'See ms-messages/.env.example',
    );
  }
}

/**
 * Parse CORS_ALLOWED_ORIGINS (comma-separated).
 * Empty / unset → reflect any origin in development only; production requires explicit list.
 */
export function resolveCorsOrigins():
  | boolean
  | string
  | string[]
  | ((
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => void) {
  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();
  const nodeEnv = process.env.NODE_ENV?.trim() ?? 'development';

  if (!raw) {
    if (nodeEnv === 'production') {
      throw new Error(
        'CORS_ALLOWED_ORIGINS is required when NODE_ENV=production',
      );
    }
    // Local/dev: reflect request origin (same as previous origin: true)
    return true;
  }

  const origins = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    return true;
  }

  if (origins.length === 1) {
    return origins[0];
  }

  return origins;
}

export function requireConfig(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
