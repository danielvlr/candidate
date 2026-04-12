import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import {
  AssessoradoDTO,
  AssessoradoPhase,
  AssessoradoStatus,
  AssessoradoHistoryDTO,
  AssessoradoHistoryType,
  JobMatchDTO,
} from '../../types/api';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  EmptyState,
  SkeletonCard,
} from '../../components/ui';

type Tab = 'informacoes' | 'vagas' | 'historico';

const PHASE_LABELS: Record<AssessoradoPhase, string> = {
  [AssessoradoPhase.ONBOARDING]: 'Onboarding',
  [AssessoradoPhase.ACTIVE_SEARCH]: 'Busca Ativa',
  [AssessoradoPhase.INTERVIEW_PREP]: 'Prep. Entrevista',
  [AssessoradoPhase.NEGOTIATION]: 'Negociação',
  [AssessoradoPhase.PLACED]: 'Colocado',
  [AssessoradoPhase.COMPLETED]: 'Concluído',
};

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

const STATUS_LABELS: Record<AssessoradoStatus, string> = {
  [AssessoradoStatus.ACTIVE]: 'Ativo',
  [AssessoradoStatus.PAUSED]: 'Pausado',
  [AssessoradoStatus.COMPLETED]: 'Concluído',
  [AssessoradoStatus.CANCELLED]: 'Cancelado',
};

const STATUS_BADGE: Record<
  AssessoradoStatus,
  'active' | 'paused' | 'hired' | 'inactive'
> = {
  [AssessoradoStatus.ACTIVE]: 'active',
  [AssessoradoStatus.PAUSED]: 'paused',
  [AssessoradoStatus.COMPLETED]: 'hired',
  [AssessoradoStatus.CANCELLED]: 'inactive',
};

const HISTORY_TYPE_LABELS: Record<AssessoradoHistoryType, string> = {
  [AssessoradoHistoryType.NOTE]: 'Nota',
  [AssessoradoHistoryType.PHASE_CHANGED]: 'Fase Alterada',
  [AssessoradoHistoryType.MEETING]: 'Reunião',
  [AssessoradoHistoryType.CV_REVIEW]: 'Revisão de CV',
  [AssessoradoHistoryType.INTERVIEW_PREP]: 'Prep. Entrevista',
  [AssessoradoHistoryType.JOB_SUGGESTED]: 'Vaga Sugerida',
  [AssessoradoHistoryType.JOB_APPLIED]: 'Candidatura',
  [AssessoradoHistoryType.FEEDBACK]: 'Feedback',
};

const HISTORY_TYPE_BADGE: Record<
  AssessoradoHistoryType,
  'info' | 'active' | 'featured' | 'urgent' | 'inactive' | 'hired'
> = {
  [AssessoradoHistoryType.NOTE]: 'info',
  [AssessoradoHistoryType.PHASE_CHANGED]: 'featured',
  [AssessoradoHistoryType.MEETING]: 'active',
  [AssessoradoHistoryType.CV_REVIEW]: 'info',
  [AssessoradoHistoryType.INTERVIEW_PREP]: 'featured',
  [AssessoradoHistoryType.JOB_SUGGESTED]: 'urgent',
  [AssessoradoHistoryType.JOB_APPLIED]: 'hired',
  [AssessoradoHistoryType.FEEDBACK]: 'inactive',
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR');

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString('pt-BR');

const PHASE_OPTIONS = Object.values(AssessoradoPhase).filter(
  (p) => p !== AssessoradoPhase.COMPLETED
);

const AssessoradoDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [assessorado, setAssessorado] = useState<AssessoradoDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('informacoes');

  const [history, setHistory] = useState<AssessoradoHistoryDTO[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [matchingJobs, setMatchingJobs] = useState<JobMatchDTO[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  const [phaseDropdownOpen, setPhaseDropdownOpen] = useState(false);
  const [changingPhase, setChangingPhase] = useState(false);
  const phaseDropdownRef = useRef<HTMLDivElement>(null);

  // Close phase dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        phaseDropdownRef.current &&
        !phaseDropdownRef.current.contains(e.target as Node)
      ) {
        setPhaseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getAssessoradoById(parseInt(id));
        setAssessorado(data);
      } catch (err) {
        setError('Erro ao carregar assessorado');
        console.error('Error loading assessorado:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'historico' && id && history.length === 0) {
      const loadHistory = async () => {
        try {
          setHistoryLoading(true);
          const data = await apiService.getAssessoradoHistory(parseInt(id));
          setHistory(data);
        } catch (err) {
          console.error('Error loading history:', err);
        } finally {
          setHistoryLoading(false);
        }
      };
      loadHistory();
    }
  }, [activeTab, id, history.length]);

  useEffect(() => {
    if (activeTab === 'vagas' && id && matchingJobs.length === 0) {
      const loadJobs = async () => {
        try {
          setJobsLoading(true);
          const data = await apiService.getMatchingJobs(parseInt(id));
          setMatchingJobs(data.sort((a, b) => b.matchScore - a.matchScore));
        } catch (err) {
          console.error('Error loading matching jobs:', err);
        } finally {
          setJobsLoading(false);
        }
      };
      loadJobs();
    }
  }, [activeTab, id, matchingJobs.length]);

  const handleChangePhase = async (phase: AssessoradoPhase) => {
    if (!id || !assessorado) return;
    try {
      setChangingPhase(true);
      await apiService.changeAssessoradoPhase(parseInt(id), phase);
      setAssessorado({ ...assessorado, currentPhase: phase });
      setPhaseDropdownOpen(false);
    } catch (err) {
      console.error('Error changing phase:', err);
    } finally {
      setChangingPhase(false);
    }
  };

  const handleTogglePause = async () => {
    if (!id || !assessorado) return;
    const newStatus =
      assessorado.status === AssessoradoStatus.ACTIVE
        ? AssessoradoStatus.PAUSED
        : AssessoradoStatus.ACTIVE;
    try {
      await apiService.updateAssessorado(parseInt(id), {
        candidateId: assessorado.candidateId,
        seniorId: assessorado.seniorId,
        advisoryStartDate: assessorado.advisoryStartDate,
        advisoryEndDate: assessorado.advisoryEndDate,
        currentPhase: assessorado.currentPhase,
        specializations: assessorado.specializations,
        objectives: assessorado.objectives,
        notes: assessorado.notes,
      });
      setAssessorado({ ...assessorado, status: newStatus });
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const getMatchScoreBadge = (
    score: number
  ): 'active' | 'paused' | 'inactive' => {
    if (score >= 70) return 'active';
    if (score >= 40) return 'paused';
    return 'inactive';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <SkeletonCard />
        <div className="mt-4">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !assessorado) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-white/90 mb-1">
              {error ?? 'Assessorado não encontrado'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/assessorados')}
              className="mt-4"
            >
              Voltar
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  const candidateName =
    assessorado.candidate?.fullName ?? `Candidato #${assessorado.candidateId}`;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/assessorados')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Voltar para Assessorados
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">
                {candidateName}
              </h1>
              <Badge variant={PHASE_BADGE[assessorado.currentPhase]}>
                {PHASE_LABELS[assessorado.currentPhase]}
              </Badge>
              <Badge variant={STATUS_BADGE[assessorado.status]}>
                {STATUS_LABELS[assessorado.status]}
              </Badge>
            </div>
            {assessorado.candidate?.headline && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {assessorado.candidate.headline}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/assessorados/${assessorado.id}/edit`)}
            >
              Editar
            </Button>

            {/* Alterar Fase dropdown */}
            <div className="relative" ref={phaseDropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPhaseDropdownOpen((v) => !v)}
                disabled={changingPhase}
              >
                Alterar Fase
                <svg
                  className="ml-1.5 h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Button>
              {phaseDropdownOpen && (
                <div className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  {PHASE_OPTIONS.map((phase) => (
                    <button
                      key={phase}
                      type="button"
                      onClick={() => handleChangePhase(phase)}
                      disabled={phase === assessorado.currentPhase}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed first:rounded-t-lg last:rounded-b-lg transition-colors"
                    >
                      {PHASE_LABELS[phase]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant={
                assessorado.status === AssessoradoStatus.ACTIVE
                  ? 'danger'
                  : 'primary'
              }
              size="sm"
              onClick={handleTogglePause}
            >
              {assessorado.status === AssessoradoStatus.ACTIVE
                ? 'Pausar'
                : 'Ativar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
        <nav className="flex gap-1 -mb-px">
          {(
            [
              { key: 'informacoes', label: 'Informações' },
              { key: 'vagas', label: 'Vagas Compatíveis' },
              { key: 'historico', label: 'Histórico' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Informacoes */}
      {activeTab === 'informacoes' && (
        <div className="space-y-6">
          {/* Dados do Candidato */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                Dados do Candidato
              </h2>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Nome
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                    {assessorado.candidate?.fullName ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                    {assessorado.candidate?.email ?? '—'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Headline
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                    {assessorado.candidate?.headline ?? '—'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Habilidades
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                    {assessorado.candidate?.skills ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Modalidade de Trabalho
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                    {assessorado.candidate?.workPreference ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Salário Desejado
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                    {assessorado.candidate?.desiredSalary != null
                      ? `R$ ${assessorado.candidate.desiredSalary.toLocaleString('pt-BR')}`
                      : '—'}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          {/* Dados da Assessoria */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                Dados da Assessoria
              </h2>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Senior Responsável
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                    {assessorado.seniorName ?? `Senior #${assessorado.seniorId}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Fase Atual
                  </dt>
                  <dd className="mt-0.5">
                    <Badge variant={PHASE_BADGE[assessorado.currentPhase]}>
                      {PHASE_LABELS[assessorado.currentPhase]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Data de Início
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                    {formatDate(assessorado.advisoryStartDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Data de Término
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                    {assessorado.advisoryEndDate
                      ? formatDate(assessorado.advisoryEndDate)
                      : '—'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Especializações
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                    {assessorado.specializations ?? '—'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Objetivos
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900 dark:text-white/90">
                    {assessorado.objectives ?? '—'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Notas
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-900 dark:text-white/90 whitespace-pre-line">
                    {assessorado.notes ?? '—'}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab: Vagas Compativeis */}
      {activeTab === 'vagas' && (
        <div>
          {jobsLoading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : matchingJobs.length === 0 ? (
            <EmptyState
              title="Nenhuma vaga compatível encontrada"
              description="Não foram encontradas vagas compatíveis com o perfil deste assessorado."
            />
          ) : (
            <div className="space-y-4">
              {matchingJobs.map((match, idx) => {
                const scorePct = Math.round(match.matchScore * 100);
                return (
                  <Card key={match.job.id ?? idx} hover>
                    <CardBody>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                              {match.job.title}
                            </h3>
                            <Badge variant={getMatchScoreBadge(scorePct)}>
                              {scorePct}% compatível
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {match.job.companyName}
                            {match.job.location ? ` • ${match.job.location}` : ''}
                            {match.job.workMode ? ` • ${match.job.workMode}` : ''}
                          </p>
                          {(match.job.minSalary || match.job.maxSalary) && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Salário:{' '}
                              {match.job.minSalary
                                ? `R$ ${match.job.minSalary.toLocaleString('pt-BR')}`
                                : ''}
                              {match.job.minSalary && match.job.maxSalary
                                ? ' – '
                                : ''}
                              {match.job.maxSalary
                                ? `R$ ${match.job.maxSalary.toLocaleString('pt-BR')}`
                                : ''}
                            </p>
                          )}
                          {match.matchingSkills.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {match.matchingSkills.map((skill) => (
                                <span
                                  key={skill}
                                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                          {match.matchReasons.length > 0 && (
                            <ul className="mt-2 space-y-0.5">
                              {match.matchReasons.map((reason, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5"
                                >
                                  <svg
                                    className="h-3.5 w-3.5 text-success-500 flex-shrink-0 mt-0.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Historico */}
      {activeTab === 'historico' && (
        <div>
          {historyLoading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              title="Nenhum registro no histórico"
              description="Ainda não há entradas no histórico deste assessorado."
            />
          ) : (
            <div className="space-y-3">
              {[...history]
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((entry) => (
                  <Card key={entry.id}>
                    <CardBody className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="h-2 w-2 rounded-full bg-brand-500 mt-1.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={HISTORY_TYPE_BADGE[entry.type]}>
                              {HISTORY_TYPE_LABELS[entry.type]}
                            </Badge>
                            <span className="text-sm font-medium text-gray-900 dark:text-white/90">
                              {entry.title}
                            </span>
                          </div>
                          {entry.description && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {entry.description}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssessoradoDetailView;
