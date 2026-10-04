import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/authApi';
import { UNAUTHORIZED_EVENT } from '../services/authFetch';
import {
  AuthUser,
  clearSession,
  loadSession,
  saveSession,
  updateSessionUser,
} from '../services/authStorage';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string, rememberMe: boolean) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Revalida a sessão salva no backend (token pode ter sido revogado / usuário desativado).
  useEffect(() => {
    const session = loadSession();
    if (!session) {
      setStatus('unauthenticated');
      return;
    }
    let cancelled = false;
    authApi
      .me(session.token)
      .then((fresh) => {
        if (cancelled) return;
        updateSessionUser(fresh);
        setUser(fresh);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  // Qualquer 401 da API (token expirado/inválido) encerra a sessão.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string, rememberMe: boolean) => {
    const session = await authApi.login(email, password, rememberMe);
    saveSession(session, rememberMe);
    setUser(session.user);
    setStatus('authenticated');
    return session.user;
  }, []);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
