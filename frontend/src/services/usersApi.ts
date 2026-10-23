import type { AuthRole, AuthUser } from './authStorage';
import { call } from './authApi';

// Gestão de usuários (somente ADMIN). O Bearer é anexado pelo authFetch.

export interface UserRoleUpdate {
  role: AuthRole;
  headhunterId?: number | null;
}

export const usersApi = {
  list(): Promise<AuthUser[]> {
    return call<AuthUser[]>('/users');
  },

  updateRole(id: number, update: UserRoleUpdate): Promise<AuthUser> {
    return call<AuthUser>(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify(update) });
  },
};
