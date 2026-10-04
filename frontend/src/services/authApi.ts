import type { AuthUser, StoredSession } from './authStorage';

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class AuthApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const DEFAULT_ERROR = 'Não foi possível concluir a operação. Tente novamente.';

async function parseError(response: Response): Promise<AuthApiError> {
  try {
    const body = await response.json();
    const fieldErrors = body?.fieldErrors ? Object.values(body.fieldErrors).join(' ') : '';
    return new AuthApiError(response.status, fieldErrors || body?.message || DEFAULT_ERROR);
  } catch {
    return new AuthApiError(response.status, DEFAULT_ERROR);
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new AuthApiError(0, 'Não foi possível conectar ao servidor.');
  }
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as T;
}

interface LoginResponse {
  token: string;
  tokenType: string;
  expiresAt: string;
  user: AuthUser;
}

export const authApi = {
  async login(email: string, password: string, rememberMe: boolean): Promise<StoredSession> {
    const res = await call<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
    return { token: res.token, expiresAt: res.expiresAt, user: res.user };
  },

  me(token: string): Promise<AuthUser> {
    return call<AuthUser>('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  },

  forgotPassword(email: string): Promise<{ message: string }> {
    return call('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  },

  validateResetToken(token: string): Promise<{ valid: boolean }> {
    return call(`/auth/reset-password/validate?token=${encodeURIComponent(token)}`);
  },

  resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return call('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
  },
};
