// Interceptor global de fetch: anexa o JWT em toda chamada à API e trata 401.
// Centralizado aqui porque várias telas chamam fetch() direto, fora do apiService.
import { API_BASE_URL } from './authApi';
import { clearSession, getToken } from './authStorage';

export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

// Endpoints que não devem disparar logout em caso de 401 (ex.: senha errada no login).
const AUTH_EXEMPT_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/public/'];

function resolveUrl(input: RequestInfo | URL): URL | null {
  try {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return new URL(raw, window.location.origin);
  } catch {
    return null;
  }
}

const apiBase = new URL(API_BASE_URL, window.location.origin);
const apiPrefix = `${apiBase.origin}${apiBase.pathname.replace(/\/+$/, '')}`;

function isApiRequest(url: URL): boolean {
  const full = `${url.origin}${url.pathname}`;
  return full.startsWith(apiPrefix) || (url.origin === window.location.origin && url.pathname.startsWith('/api/'));
}

function isExempt(url: URL): boolean {
  return AUTH_EXEMPT_PATHS.some((p) => url.pathname.includes(p));
}

let installed = false;

export function installAuthFetch(): void {
  if (installed) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = resolveUrl(input);
    if (!url || !isApiRequest(url)) {
      return originalFetch(input, init);
    }

    const token = getToken();
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await originalFetch(input, { ...init, headers });

    if (response.status === 401 && !isExempt(url)) {
      clearSession();
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    return response;
  };
}
