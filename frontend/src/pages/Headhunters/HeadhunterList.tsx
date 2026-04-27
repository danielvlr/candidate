import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useClientFilter } from '../../context/ClientFilterContext';
import { useListSelection } from '../../hooks/useListSelection';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  EmptyState,
  SkeletonCard,
} from '../../components/ui';

interface Headhunter {
  id?: number;
  fullName: string;
  email: string;
  phone?: string;
  status?: string;
  specialties?: string[];
  candidatesCount?: number;
  placementsCount?: number;
  createdAt?: string;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const AVATAR_GRADIENTS = [
  'from-brand-400 to-brand-600',
  'from-purple-400 to-purple-600',
  'from-teal-400 to-teal-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
];

const getGradient = (name: string) =>
  AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];


const HeadhunterList: React.FC = () => {
  const navigate = useNavigate();
  const { selectedClientId } = useClientFilter();
  const {
    selectedId: selectedHeadhunterId,
    selectedCount,
    handleRowClick,
    handleRowMouseDown,
    clearSelection,
    isSelected,
  } = useListSelection<Headhunter>();
  const [headhunters, setHeadhunters] = useState<Headhunter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        const res = await apiService.getHeadhunters();
        let list = res.content;
        // Filtro global por cliente: mostrar apenas HHs com vagas no cliente selecionado.
        if (selectedClientId) {
          const jobsRes = await apiService.getJobs({ page: 0, size: 1000 }, { clientId: selectedClientId });
          const hhIds = new Set(
            (jobsRes.content || [])
              .map((j: any) => j.headhunterId)
              .filter((id: number | undefined): id is number => id != null),
          );
          list = list.filter((h) => h.id != null && hhIds.has(h.id));
        }
        setHeadhunters(list);
      } catch (err) {
        console.error('Error loading headhunters:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedClientId]);

  const filteredHeadhunters = headhunters.filter(
    (h) =>
      h.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (h.specialties ?? []).some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStatusToggle = (id: number) => {
    setHeadhunters((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, status: h.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
          : h
      )
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">
            Headhunters
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">
            Headhunters
          </h1>
          <Button variant="primary" onClick={() => navigate('/headhunters/new')}>
            Novo Headhunter
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por nome, email ou especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Action bar */}
      {(() => {
        const hasSelection = selectedCount > 0;
        const single =
          selectedCount === 1
            ? filteredHeadhunters.find((h) => h.id === selectedHeadhunterId)
            : null;
        return (
          <div
            className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
              hasSelection
                ? 'bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30'
                : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <span
              className={`text-sm font-medium mr-auto ${
                hasSelection
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {selectedCount > 1
                ? `${selectedCount} headhunters selecionados`
                : single
                ? single.fullName
                : 'Selecione um headhunter'}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={!single}
              onClick={() => single?.id && handleStatusToggle(single.id)}
            >
              {single?.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!single}
              onClick={() => single && navigate(`/headhunters/${single.id}/edit`)}
            >
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasSelection}
              onClick={clearSelection}
            >
              ✕
            </Button>
          </div>
        );
      })()}

      {/* Results */}
      <Card>
        <CardHeader
          action={
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredHeadhunters.length} headhunters
            </span>
          }
        >
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
            Resultados
          </h2>
        </CardHeader>

        {filteredHeadhunters.length === 0 ? (
          <CardBody>
            <EmptyState
              title="Nenhum headhunter encontrado"
              description="Tente ajustar a busca ou adicione um novo headhunter."
              actionLabel="Novo Headhunter"
              onAction={() => navigate('/headhunters/new')}
            />
          </CardBody>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredHeadhunters.map((headhunter) => (
              <div
                key={headhunter.id}
                className={`flex items-center px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-shadow duration-150 hover:shadow-theme-sm${
                  isSelected(headhunter)
                    ? ' ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : ''
                }`}
                onMouseDown={handleRowMouseDown}
                onClick={(e) => handleRowClick(headhunter, e)}
                onDoubleClick={() => navigate(`/headhunters/${headhunter.id}`)}
              >
                <div className="flex items-center flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="mr-4 flex-shrink-0">
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${getGradient(headhunter.fullName)} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}
                    >
                      {getInitials(headhunter.fullName)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">
                        {headhunter.fullName}
                      </h3>
                      <Badge
                        variant={
                          headhunter.status === 'ACTIVE' ? 'active' : 'inactive'
                        }
                      >
                        {headhunter.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {headhunter.email}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(headhunter.specialties ?? []).map((specialty, index) => (
                        <Badge key={index} variant="info">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {headhunter.candidatesCount} candidatos
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {headhunter.placementsCount} colocações
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default HeadhunterList;
