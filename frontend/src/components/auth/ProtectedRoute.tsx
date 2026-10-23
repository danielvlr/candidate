import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';

function FullScreenLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
      <div
        role="status"
        aria-label="Carregando"
        className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"
      />
    </div>
  );
}

/** Só renderiza o conteúdo com usuário autenticado; senão manda para /signin guardando a rota de origem. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, signedOutByUser } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullScreenLoader />;
  }
  if (status === 'unauthenticated') {
    // "Sair" não guarda a rota: o próximo usuário não deve herdar a última página do anterior.
    const state = signedOutByUser ? undefined : { from: location };
    return <Navigate to="/signin" replace state={state} />;
  }
  return <>{children}</>;
}

interface RedirectState {
  from?: { pathname: string; search?: string };
}

/** Telas de login/recuperação: usuário já logado volta para a rota de origem (ou o painel). */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullScreenLoader />;
  }
  if (status === 'authenticated') {
    const from = (location.state as RedirectState | null)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search ?? ''}` : '/'} replace />;
  }
  return <>{children}</>;
}
