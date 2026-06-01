const LOCAL_AUTH_HOST = /localhost|127\.0\.0\.1/i;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * Resolve the canonical app URL for Auth.js (AUTH_URL).
 * Ignores localhost AUTH_URL on Vercel so production never redirects to local dev.
 */
export function resolveAuthUrl(): string | undefined {
  const configured = process.env.AUTH_URL?.trim();

  if (configured && !LOCAL_AUTH_HOST.test(configured)) {
    return stripTrailingSlash(configured);
  }

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) {
    return stripTrailingSlash(`https://${vercelProduction}`);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return stripTrailingSlash(`https://${vercelUrl}`);
  }

  if (configured) {
    return stripTrailingSlash(configured);
  }

  return undefined;
}

/** Set AUTH_URL before NextAuth initializes (server/middleware). */
export function ensureAuthUrl(): void {
  const resolved = resolveAuthUrl();
  if (resolved) {
    process.env.AUTH_URL = resolved;
  }
}

/**
 * Prevent open redirects to localhost baked into callbackUrl query params.
 */
export function safeCallbackPath(callbackUrl?: string | null): string {
  if (!callbackUrl?.trim()) return '/';

  const value = callbackUrl.trim();

  if (value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }

  try {
    const url = new URL(value);
    if (LOCAL_AUTH_HOST.test(url.hostname)) {
      return url.pathname + url.search || '/';
    }
    if (url.pathname) {
      return url.pathname + url.search;
    }
  } catch {
    if (LOCAL_AUTH_HOST.test(value)) {
      return '/';
    }
  }

  return '/';
}
