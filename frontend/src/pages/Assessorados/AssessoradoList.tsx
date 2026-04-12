import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AssessoradoDTO,
  AssessoradoPhase,
  AssessoradoHistoryDTO,
  AssessoradoHistoryType,
} from '../../types/api';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  EmptyState,
  Pagination,
  SkeletonCard,
} from '../../components/ui';
import { useListSelection } from '../../hooks/useListSelection';
import { useToast } from '../../components/ui';
import AssessoradoKanban from './AssessoradoKanban';
import { PHASE_LABELS, STATUS_LABELS, STATUS_BADGE } from './mockData';
import { apiService } from '../../services/api';

const PHASE_BADGE: Record<
  AssessoradoPhase,
  'info' | 'active' | 'featured' | 'urgent' | 'inactive'
> = {
  [AssessoradoPhase.ONBOARDING]: 'info',
  [AssessoradoPhase.ACTIVE_SEARCH]: 'active',
  [AssessoradoPhase.INTERVIEW_PREP]: 'featured',
  [AssessoradoPhase.NEGOTIATION]: 'urgent',
  [AssessoradoPhase.PLACED]: 'active',
  [AssessoradoPhase.COMPLETED]: 'inactive',
};

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_GRADIENTS = [
  'from-brand-400 to-brand-600',
  'from-purple-400 to-purple-600',
  'from-teal-400 to-teal-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
];

const getGradient = (name: string) =>
  AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR');

type ViewMode = 'list' | 'kanban';

const STORAGE_KEY = 'camarmo_assessorado_viewMode';

const AssessoradoList: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    selectedId: selectedAssessoradoId,
    selectedCount,
    handleRowClick,
    handleRowMouseDown,
    clearSelection,
    isSelected,
  } = useListSelection<AssessoradoDTO>();

  const [assessorados, setAssessorados] = useState<AssessoradoDTO[]>([]);
  const [, setHistory] = useState<AssessoradoHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ViewMode) || 'kanban';
  });
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    Promise.all([
      apiService.getAssessorados().then(res => res.content || []),
      Promise.resolve([]), // history loaded per-assessorado
    ])
      .then(([assessoradoData, historyData]) => {
        setAssessorados(assessoradoData);
        setHistory(historyData);
      })
      .catch(err => console.error('Error loading assessorados:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  const handlePhaseChange = (
    id: number,
    fromPhase: AssessoradoPhase,
    toPhase: AssessoradoPhase
  ) => {
    const assessorado = assessorados.find((a) => a.id === id);
    if (!assessorado) return;

    const name = assessorado.candidate?.fullName ?? 'Candidato';

    setAssessorados((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, currentPhase: toPhase } : a
      )
    );

    const newEntry: AssessoradoHistoryDTO = {
      id: Date.now(),
      assessoradoId: id,
      type: AssessoradoHistoryType.PHASE_CHANGED,
      title: `Fase alterada de ${PHASE_LABELS[fromPhase]} para ${PHASE_LABELS[toPhase]}`,
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [newEntry, ...prev]);

    addToast({
      type: 'success',
      title: 'Fase alterada',
      message: `${name}: ${PHASE_LABELS[fromPhase]} → ${PHASE_LABELS[toPhase]}`,
    });
  };

  // Pagination for list view
  const totalPages = Math.ceil(assessorados.length / pageSize);
  const paginatedAssessorados = assessorados.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">
            Assessorados
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
    <div className="container mx-auto px-4 py-8 overflow-hidden">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">
          Assessorados
        </h1>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Kanban
            </button>
          </div>

          <Button variant="primary" onClick={() => navigate('/assessorados/new')}>
            Novo Assessorado
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <AssessoradoKanban
          assessorados={assessorados}
          onPhaseChange={handlePhaseChange}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Action Bar */}
          {(() => {
            const hasSelection = selectedCount > 0;
            const single =
              selectedCount === 1
                ? assessorados.find((a) => a.id === selectedAssessoradoId)
                : null;
            const singleName = single?.candidate?.fullName ?? 'Candidato';
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
                    ? `${selectedCount} assessorados selecionados`
                    : single
                    ? singleName
                    : 'Selecione um assessorado'}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!single}
                  onClick={() =>
                    single && navigate(`/assessorados/${single.id}`)
                  }
                >
                  Ver Detalhes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!single}
                  onClick={() =>
                    single && navigate(`/assessorados/${single.id}/edit`)
                  }
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

          <Card>
            <CardHeader
              action={
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {assessorados.length} assessorados
                </span>
              }
            >
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                Resultados
              </h2>
            </CardHeader>

            {assessorados.length === 0 ? (
              <CardBody>
                <EmptyState
                  title="Nenhum assessorado encontrado"
                  description="Crie o primeiro assessorado para começar."
                  actionLabel="Novo Assessorado"
                  onAction={() => navigate('/assessorados/new')}
                />
              </CardBody>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedAssessorados.map((assessorado) => {
                  const name =
                    assessorado.candidate?.fullName ?? 'Candidato';
                  return (
                    <div
                      key={assessorado.id}
                      className={`flex items-center px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-shadow duration-150 hover:shadow-theme-sm${
                        isSelected(assessorado)
                          ? ' ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-500/10'
                          : ''
                      }`}
                      onMouseDown={handleRowMouseDown}
                      onClick={(e) => handleRowClick(assessorado, e)}
                      onDoubleClick={() =>
                        navigate(`/assessorados/${assessorado.id}`)
                      }
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="mr-4 flex-shrink-0">
                          <div
                            className={`w-11 h-11 rounded-full bg-gradient-to-br ${getGradient(name)} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}
                          >
                            {getInitials(name)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">
                              {name}
                            </h3>
                            <Badge
                              variant={PHASE_BADGE[assessorado.currentPhase]}
                            >
                              {PHASE_LABELS[assessorado.currentPhase]}
                            </Badge>
                            <Badge variant={STATUS_BADGE[assessorado.status]}>
                              {STATUS_LABELS[assessorado.status]}
                            </Badge>
                          </div>
                          {assessorado.candidate?.headline && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              {assessorado.candidate.headline}
                            </p>
                          )}
                          {assessorado.candidate?.email && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {assessorado.candidate.email}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {assessorado.seniorName && (
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                Senior: {assessorado.seniorName}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Início: {formatDate(assessorado.advisoryStartDate)}
                            </p>
                          </div>
                          {assessorado.specializations && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">
                              {assessorado.specializations.length > 80
                                ? assessorado.specializations.slice(0, 80) +
                                  '…'
                                : assessorado.specializations}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={assessorados.length}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AssessoradoList;
