// Persistência da sessão JWT.
// "Manter conectado" → localStorage (sobrevive ao fechar o navegador); senão → sessionStorage.

export type AuthRole = 'ADMIN' | 'HEADHUNTER' | 'CPARTNER';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: AuthRole;
  headhunterId: number | null;
  active: boolean;
}

export interface StoredSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

const STORAGE_KEY = 'camarmo.auth';

function safeGet(storage: Storage): StoredSession | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function isExpired(session: StoredSession): boolean {
  const expiresAt = Date.parse(session.expiresAt);
  return Number.isNaN(expiresAt) || expiresAt <= Date.now();
}

export function loadSession(): StoredSession | null {
  const session = safeGet(localStorage) ?? safeGet(sessionStorage);
  if (session && isExpired(session)) {
    clearSession();
    return null;
  }
  return session;
}

export function saveSession(session: StoredSession, remember: boolean): void {
  clearSession();
  try {
    (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage indisponível (modo privado/bloqueado): a sessão vive só em memória
  }
}

export function updateSessionUser(user: AuthUser): void {
  for (const storage of [localStorage, sessionStorage]) {
    const session = safeGet(storage);
    if (session) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify({ ...session, user }));
      } catch {
        // ignora
      }
    }
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignora
  }
}

export function getToken(): string | null {
  return loadSession()?.token ?? null;
}
