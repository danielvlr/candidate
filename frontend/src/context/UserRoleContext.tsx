import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'headhunter' | 'senior';

interface UserRoleContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isDevelopment: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

interface UserRoleProviderProps {
  children: ReactNode;
}

export const UserRoleProvider: React.FC<UserRoleProviderProps> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>('admin');

  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

  const value = {
    userRole,
    setUserRole,
    isDevelopment
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