import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { AuthRole } from '../services/authStorage';

export type UserRole = 'admin' | 'headhunter' | 'cpartner';

interface UserRoleContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isDevelopment: boolean;
  /** Só ADMIN em ambiente de desenvolvimento pode simular outro perfil (RoleSelector). */
  canSwitchRole: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

const ROLE_MAP: Record<AuthRole, UserRole> = {
  ADMIN: 'admin',
  HEADHUNTER: 'headhunter',
  CPARTNER: 'cpartner',
};

interface UserRoleProviderProps {
  children: ReactNode;
}

export const UserRoleProvider: React.FC<UserRoleProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [override, setOverride] = useState<UserRole | null>(null);

  const isDevelopment = import.meta.env.DEV;
  const canSwitchRole = isDevelopment && user?.role === 'ADMIN';
  const baseRole: UserRole = user ? ROLE_MAP[user.role] : 'headhunter';

  // Troca de usuário (login/logout) descarta qualquer simulação de perfil.
  useEffect(() => {
    setOverride(null);
  }, [user?.id]);

  const setUserRole = (role: UserRole) => {
    if (canSwitchRole) {
      setOverride(role);
    }
  };

  const value = {
    userRole: (canSwitchRole && override) || baseRole,
    setUserRole,
    isDevelopment,
    canSwitchRole,
  };

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = (): UserRoleContextType => {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};
