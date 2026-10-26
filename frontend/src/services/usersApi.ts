import type { AuthRole, AuthUser } from './authStorage';
import { call } from './authApi';

// Gestão de usuários (somente ADMIN). O Bearer é anexado pelo authFetch.

export interface UserRoleUpdate {
  role: AuthRole;
  headhunterId?: number | null;
  /** true remove o vínculo com o headhunter (headhunterId nulo sozinho mantém o atual). */
  clearHeadhunter?: boolean;
}

export interface UserCreate {
  email: string;
  fullName: string;
  password: string;
  role: AuthRole;
  headhunterId?: number | null;
}

export const usersApi = {
  list(): Promise<AuthUser[]> {
    return call<AuthUser[]>('/users');
  },

  create(user: UserCreate): Promise<AuthUser> {
    return call<AuthUser>('/users', { method: 'POST', body: JSON.stringify(user) });
  },

  setActive(id: number, active: boolean): Promise<AuthUser> {
    return call<AuthUser>(`/users/${id}/${active ? 'activate' : 'deactivate'}`, { method: 'PATCH' });
  },

  /** Admin define a senha; o usuário será obrigado a trocá-la no próximo acesso. */
  setPassword(id: number, newPassword: string): Promise<AuthUser> {
    return call<AuthUser>(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    });
  },

  updateRole(id: number, update: UserRoleUpdate): Promise<AuthUser> {
    return call<AuthUser>(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify(update) });
  },
};
