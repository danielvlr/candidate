import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { WarrantyRuleDTO, ServiceCategory } from '../../types/api';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  useToast,
} from '../../components/ui';

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  [ServiceCategory.PROJETOS]: 'Projetos',
  [ServiceCategory.NOSSO_HEADHUNTER]: 'Nosso Headhunter',
  [ServiceCategory.TATICAS]: 'Táticas',
  [ServiceCategory.EXECUTIVAS]: 'Executivas',
};

const ALL_CATEGORIES = Object.values(ServiceCategory);

const WarrantyRules: React.FC = () => {
  const { addToast } = useToast();
  const [rules, setRules] = useState<WarrantyRuleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDays, setEditDays] = useState<string>('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState<ServiceCategory>(ServiceCategory.PROJETOS);
  const [newDays, setNewDays] = useState<string>('90');
  const [adding, setAdding] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await apiService.getWarrantyRules();
      setRules(data);
    } catch (err) {
      addToast({ type: 'error', title: 'Erro ao carregar regras de garantia' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleEditStart = (rule: WarrantyRuleDTO) => {
    setEditingId(rule.id);
    setEditDays(String(rule.defaultDays));
  };

  const handleEditSave = async (rule: WarrantyRuleDTO) => {
    const days = parseInt(editDays, 10);
    if (isNaN(days) || days <= 0) {
      addToast({ type: 'error', title: 'Informe um número de dias válido' });
      return;
    }
    setSavingId(rule.id);
    try {
      await apiService.updateWarrantyRule(rule.id, { defaultDays: days });
      addToast({ type: 'success', title: 'Regra atualizada com sucesso' });
      setEditingId(null);
      fetchRules();
    } catch (err) {
      addToast({ type: 'error', title: 'Erro ao atualizar regra' });
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (rule: WarrantyRuleDTO) => {
    setSavingId(rule.id);
    try {
      await apiService.updateWarrantyRule(rule.id, { active: !rule.active });
      addToast({
        type: 'success',
        title: rule.active ? 'Regra desativada' : 'Regra ativada',
      });
      fetchRules();
    } catch (err) {
      addToast({ type: 'error', title: 'Erro ao alterar status da regra' });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (rule: WarrantyRuleDTO) => {
    setDeletingId(rule.id);
    try {
      await apiService.deleteWarrantyRule(rule.id);
      addToast({ type: 'success', title: 'Regra removida com sucesso' });
      fetchRules();
    } catch (err) {
      addToast({ type: 'error', title: 'Erro ao remover regra' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddRule = async () => {
    const days = parseInt(newDays, 10);
    if (isNaN(days) || days <= 0) {
      addToast({ type: 'error', title: 'Informe um número de dias válido' });
      return;
    }
    setAdding(true);
    try {
      await apiService.createWarrantyRule(newCategory, days);
      addToast({ type: 'success', title: 'Regra criada com sucesso' });
      setShowAddForm(false);
      setNewDays('90');
      setNewCategory(ServiceCategory.PROJETOS);
      fetchRules();
    } catch (err) {
      addToast({ type: 'error', title: 'Erro ao criar regra' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">
              Regras de Garantia
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure os dias de garantia por categoria de serviço
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
            Nova Regra
          </Button>
        </div>

        {/* Add rule form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
                Adicionar Nova Regra
              </h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-end gap-4 flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ServiceCategory)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:focus:border-brand-700"
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dias
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newDays}
                    onChange={(e) => setNewDays(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:focus:border-brand-700"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" loading={adding} onClick={handleAddRule}>
                    Salvar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)} disabled={adding}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Rules table */}
        <Card>
          <CardBody>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : rules.length === 0 ? (
              <EmptyState
                title="Nenhuma regra configurada"
                description="Adicione regras de garantia por categoria de serviço."
                actionLabel="Adicionar Regra"
                onAction={() => setShowAddForm(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Dias Default
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white/90">
                          {CATEGORY_LABELS[rule.serviceCategory] ?? rule.serviceCategory}
                        </td>
                        <td className="py-3 pr-4">
                          {editingId === rule.id ? (
                            <input
                              type="number"
                              min={1}
                              value={editDays}
                              onChange={(e) => setEditDays(e.target.value)}
                              className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">
                              {rule.defaultDays} dias
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            rule.active
                              ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {rule.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editingId === rule.id ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  loading={savingId === rule.id}
                                  onClick={() => handleEditSave(rule)}
                                >
                                  Salvar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingId(null)}
                                  disabled={savingId === rule.id}
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditStart(rule)}
                                  disabled={savingId === rule.id}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  loading={savingId === rule.id}
                                  onClick={() => handleToggleActive(rule)}
                                >
                                  {rule.active ? 'Desativar' : 'Ativar'}
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  loading={deletingId === rule.id}
                                  onClick={() => handleDelete(rule)}
                                >
                                  Remover
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
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

export default WarrantyRules;
