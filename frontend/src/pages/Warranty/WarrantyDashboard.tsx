import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { apiService } from '../../services/api';
import { WarrantyDTO, WarrantyStatus } from '../../types/api';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  SkeletonStatCard,
  useToast,
} from '../../components/ui';
import WarrantyBreachModal from './WarrantyBreachModal';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400',
  EXPIRING_SOON: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400',
  EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  BREACHED: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400',
  PENDING: 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativa',
  EXPIRING_SOON: 'Expirando',
  EXPIRED: 'Expirada',
  BREACHED: 'Quebrada',
  PENDING: 'Pendente',
};

const CATEGORY_LABELS: Record<string, string> = {
  PROJETOS: 'Projetos',
  NOSSO_HEADHUNTER: 'Nosso Headhunter',
  TATICAS: 'Táticas',
  EXECUTIVAS: 'Executivas',
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos os Status' },
  { value: 'ACTIVE', label: 'Ativas' },
  { value: 'EXPIRING_SOON', label: 'Expirando em breve' },
  { value: 'EXPIRED', label: 'Expiradas' },
  { value: 'BREACHED', label: 'Quebradas' },
  { value: 'PENDING', label: 'Pendentes' },
];

const WarrantyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [warranties, setWarranties] = useState<WarrantyDTO[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [breachModal, setBreachModal] = useState<{ warrantyId: number } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [warrantiesData, countsData] = await Promise.all([
        apiService.getWarranties(statusFilter || undefined),
        apiService.getWarrantyCounts(),
      ]);
      setWarranties(warrantiesData);
      setCounts(countsData);
    } catch (err) {
      addToast({ type: 'error', title: 'Erro ao carregar garantias' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR');

  const summaryCards = [
    {
      label: 'Total Ativas',
      value: counts['ACTIVE'] ?? 0,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-500/10',
    },
    {
      label: 'Expirando em 10d',
      value: counts['EXPIRING_SOON'] ?? 0,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-500/10',
    },
    {
      label: 'Expiradas',
      value: counts['EXPIRED'] ?? 0,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-700',
    },
    {
      label: 'Quebradas',
      value: counts['BREACHED'] ?? 0,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-500/10',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">
              Garantias
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Acompanhe o status das garantias de todas as vagas
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
            : summaryCards.map((card) => (
                <Card key={card.label} hover>
                  <CardBody>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${card.bg}`}>
                        <svg className={`w-5 h-5 ${card.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                        <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
        </div>

        {/* Filter and table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
                Lista de Garantias
              </h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:focus:border-brand-700"
              >
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : warranties.length === 0 ? (
              <EmptyState
                title="Nenhuma garantia encontrada"
                description="Não há garantias para os filtros selecionados."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vaga</th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Candidato</th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Headhunter</th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Início</th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fim</th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dias Rest.</th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="pb-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {warranties.map((w) => (
                      <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/jobs/${w.jobId}`)}
                            className="font-medium text-brand-600 dark:text-brand-400 hover:underline text-left"
                          >
                            {w.jobTitle ?? `Vaga #${w.jobId}`}
                          </button>
                        </td>
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                          {w.candidateName ?? '—'}
                        </td>
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                          {w.headhunterName ?? '—'}
                        </td>
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                          {w.clientName ?? '—'}
                        </td>
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                          {CATEGORY_LABELS[w.serviceCategory] ?? w.serviceCategory}
                        </td>
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                          {formatDate(w.startDate)}
                        </td>
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                          {formatDate(w.endDate)}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`font-medium ${
                            (w.daysRemaining ?? 0) <= 0
                              ? 'text-red-600 dark:text-red-400'
                              : (w.daysRemaining ?? 0) <= 10
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {w.daysRemaining !== undefined && w.daysRemaining !== null
                              ? w.daysRemaining <= 0
                                ? '0'
                                : w.daysRemaining
                              : '—'}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[w.status] ?? ''}`}>
                            {STATUS_LABELS[w.status] ?? w.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {(w.status === WarrantyStatus.ACTIVE || w.status === WarrantyStatus.EXPIRING_SOON) && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setBreachModal({ warrantyId: w.id })}
                            >
                              Registrar Breach
                            </Button>
                          )}
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

      {breachModal && (
        <WarrantyBreachModal
          warrantyId={breachModal.warrantyId}
          isOpen={true}
          onClose={() => setBreachModal(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default WarrantyDashboard;
