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
  /** true quando a sessão acabou por "Sair" (e não por expiração). */
  signedOutByUser: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [signedOutByUser, setSignedOutByUser] = useState(false);

  // Sessão encerrada sem ação do usuário (401, token revogado): ao logar de novo, volta à rota de origem.
  const endSession = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // "Sair" pelo menu: o próximo login (possivelmente de outro usuário) começa no painel.
  const logout = useCallback(() => {
    setSignedOutByUser(true);
    endSession();
  }, [endSession]);

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
        if (!cancelled) endSession();
      });
    return () => {
      cancelled = true;
    };
  }, [endSession]);

  // Qualquer 401 da API (token expirado/inválido) encerra a sessão.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, endSession);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, endSession);
  }, [endSession]);

  const login = useCallback(async (email: string, password: string, rememberMe: boolean) => {
    const session = await authApi.login(email, password, rememberMe);
    saveSession(session, rememberMe);
    setUser(session.user);
    setSignedOutByUser(false);
    setStatus('authenticated');
    return session.user;
  }, []);

  const value = useMemo(
    () => ({ user, status, signedOutByUser, login, logout }),
    [user, status, signedOutByUser, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
