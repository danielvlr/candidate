import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';
import { usersApi, UserRoleUpdate } from '../../services/usersApi';
import type { AuthRole, AuthUser } from '../../services/authStorage';
import type { HeadhunterDTO } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, CardBody, Input, Select, useToast } from '../../components/ui';

const ROLE_OPTIONS: { value: AuthRole; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'HEADHUNTER', label: 'Headhunter' },
  { value: 'CPARTNER', label: 'C-Partner' },
];

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Não foi possível alterar o perfil.';

const UserManagementPage: React.FC = () => {
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [headhunters, setHeadhunters] = useState<HeadhunterDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([usersApi.list(), apiService.getHeadhunters({ page: 0, size: 1000 })])
      .then(([userList, hhPage]) => {
        setUsers(userList);
        setHeadhunters(hhPage.content ?? []);
      })
      .catch(() => addToast({ type: 'error', title: 'Erro ao carregar usuários' }))
      .finally(() => setLoading(false));
  }, [addToast]);

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...users].sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'));
    if (!term) return sorted;
    return sorted.filter(
      (u) => u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term),
    );
  }, [users, search]);

  const headhunterOptions = useMemo(
    () => [
      { value: '', label: 'Sem vínculo' },
      ...headhunters
        .filter((h) => h.id !== undefined)
        .map((h) => ({ value: String(h.id), label: h.fullName })),
    ],
    [headhunters],
  );

  const save = async (target: AuthUser, update: UserRoleUpdate) => {
    setSavingId(target.id);
    try {
      const updated = await usersApi.updateRole(target.id, update);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      addToast({
        type: 'success',
        title: 'Perfil atualizado',
        message: `${updated.fullName} agora é ${ROLE_OPTIONS.find((r) => r.value === updated.role)?.label}.`,
      });
    } catch (err) {
      addToast({ type: 'error', title: errorMessage(err) });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">Usuários</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Defina quem é administrador ou headhunter. A mudança vale no próximo carregamento da página do usuário.
          </p>
        </div>

        <Input
          name="user-search"
          placeholder="Buscar por nome ou email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Card>
          <CardBody>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Carregando usuários...</p>
            ) : visibleUsers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum usuário encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      <th className="py-2 pr-4 font-medium">Usuário</th>
                      <th className="py-2 pr-4 font-medium">Perfil</th>
                      <th className="py-2 pr-4 font-medium">Headhunter vinculado</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleUsers.map((u) => {
                      const isSelf = u.id === currentUser?.id;
                      const busy = savingId === u.id;
                      return (
                        <tr key={u.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                          <td className="py-3 pr-4">
                            <div className="font-medium text-gray-900 dark:text-white/90">
                              {u.fullName}
                              {isSelf && <span className="ml-2 text-xs text-gray-400">(você)</span>}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                          </td>
                          <td className="py-3 pr-4 min-w-[170px]">
                            <Select
                              name={`role-${u.id}`}
                              aria-label={`Perfil de ${u.fullName}`}
                              options={ROLE_OPTIONS}
                              value={u.role}
                              disabled={isSelf || busy}
                              title={isSelf ? 'Você não pode alterar o seu próprio perfil' : undefined}
                              onChange={(e) => save(u, { role: e.target.value as AuthRole })}
                            />
                          </td>
                          <td className="py-3 pr-4 min-w-[200px]">
                            {u.role === 'HEADHUNTER' ? (
                              <Select
                                name={`headhunter-${u.id}`}
                                aria-label={`Headhunter vinculado a ${u.fullName}`}
                                options={headhunterOptions}
                                value={u.headhunterId != null ? String(u.headhunterId) : ''}
                                disabled={busy}
                                onChange={(e) =>
                                  e.target.value &&
                                  save(u, { role: u.role, headhunterId: Number(e.target.value) })
                                }
                              />
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-3">
                            <Badge variant={u.active ? 'active' : 'inactive'} dot>
                              {u.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default UserManagementPage;
