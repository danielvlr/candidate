import React from 'react';
import { Navigate } from 'react-router';
import { useUserRole } from '../../context/UserRoleContext';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/',
  fallback
}) => {
  const { userRole } = useUserRole();

  if (!allowedRoles.includes(userRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;