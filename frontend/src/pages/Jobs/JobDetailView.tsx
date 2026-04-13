import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { apiService } from '../../services/api';
import { JobDTO, WarrantyDTO, WarrantyStatus } from '../../types/api';
import { useUserRole } from '../../context/UserRoleContext';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
  EmptyState,
  SkeletonText,
  useToast,
} from '../../components/ui';
import { JobTimeline } from '../../components/job/JobTimeline';
// import { JobShortlist } from '../../components/job/JobShortlist';
import { AddActivityModal } from '../../components/job/AddActivityModal';
import { SendCandidatesModal } from '../../components/job/SendCandidatesModal';
import WarrantyBreachModal from '../Warranty/WarrantyBreachModal';

type ActiveTab = 'detalhes' | 'candidatos' | 'historico';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  APPLIED: { label: 'Mapeado', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  SHORTLISTED: { label: 'Apresentado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  INTERVIEW_SCHEDULED: { label: 'Entrevista', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  UNDER_REVIEW: { label: 'Checagem', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  HIRED: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const JobApplicationsList: React.FC<{ jobId: number }> = ({ jobId }) => {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLink, setShowLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const navigate = useNavigate();

  const loadApps = () => {
    apiService.getApplicationsByJob(jobId, { page: 0, size: 50 })
      .then(res => setApps(res.content || []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadApps(); }, [jobId]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await apiService.searchCandidates(query, { page: 0, size: 10 });
      const existingIds = new Set(apps.map(a => a.candidate?.id).filter(Boolean));
      setSearchResults((res.content || []).filter(c => c.id && !existingIds.has(c.id)));
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleLink = async (candidateId: number) => {
    setLinking(true);
    try {
      await apiService.linkCandidateToJob(candidateId, jobId);
      setSearchQuery('');
      setSearchResults([]);
      setShowLink(false);
      setLoading(true);
      loadApps();
    } catch (err) {
      console.error('Error linking candidate:', err);
    } finally { setLinking(false); }
  };

  return (
    <Card>
      <CardHeader action={
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{apps.length} candidatos</span>
          <Button variant="primary" size="sm" onClick={() => setShowLink(!showLink)}
            icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
            Vincular
          </Button>
        </div>
      }>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">Candidatos Vinculados</h2>
      </CardHeader>

      {showLink && (
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar candidato por nome..."
            autoFocus
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          />
          {searching && <p className="text-xs text-gray-400 mt-2">Buscando...</p>}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              {searchResults.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => !linking && handleLink(c.id!)}>
                  <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      {c.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.headline || c.email}</p>
                  </div>
                  <span className="text-xs text-brand-500 font-medium">{linking ? '...' : 'Vincular'}</span>
                </div>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">Nenhum candidato encontrado.</p>
          )}
        </div>
      )}

      {loading ? (
        <CardBody><p className="text-sm text-gray-400 text-center py-4">Carregando candidatos...</p></CardBody>
      ) : apps.length === 0 ? (
        <CardBody><EmptyState title="Nenhum candidato vinculado" description="Clique em 'Vincular' para associar candidatos a esta vaga." /></CardBody>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {apps.map((app) => {
            const candidate = app.candidate || {};
            const st = STATUS_LABELS[app.status] || STATUS_LABELS.APPLIED;
            return (
              <div
                key={app.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => candidate.id && navigate(`/candidates/${candidate.id}`)}
              >
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                    {(candidate.fullName || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{candidate.fullName || 'Candidato'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{candidate.headline || candidate.email || ''}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

const backArrowSVG = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const getStatusBadgeVariant = (status: string): React.ComponentProps<typeof Badge>['variant'] => {
  switch (status) {
    case 'ACTIVE':  return 'active';
    case 'PAUSED':  return 'paused';
    case 'CLOSED':  return 'closed';
    case 'EXPIRED': return 'expired';
    case 'DRAFT':   return 'draft';
    default:        return 'inactive';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ACTIVE':  return 'Ativa';
    case 'PAUSED':  return 'Pausada';
    case 'CLOSED':  return 'Fechada';
    case 'EXPIRED': return 'Expirada';
    case 'DRAFT':   return 'Rascunho';
    default:        return status;
  }
};

const JobDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userRole } = useUserRole();
  const { addToast } = useToast();
  const [job, setJob] = useState<JobDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ action: string; jobId: number } | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'historico' || tab === 'candidatos') return tab;
    return 'detalhes';
  });
  const [shortlistCount, setShortlistCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showSendCandidates, setShowSendCandidates] = useState(false);
  const [closingFinalValue, setClosingFinalValue] = useState<string>('');
  const [tabRefreshKey, setTabRefreshKey] = useState(0);
  const [warranty, setWarranty] = useState<WarrantyDTO | null>(null);
  const [showBreachModal, setShowBreachModal] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const jobData = await apiService.getJobById(Number(id));
        setJob(jobData);
      } catch (err) {
        setError('Erro ao carregar detalhes da vaga');
        console.error('Error fetching job:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!id) return;
      const jobId = Number(id);
      try {
        const [shortlistCounts, historyCounts] = await Promise.all([
          apiService.getShortlistCounts(jobId),
          apiService.getJobHistoryCounts(jobId),
        ]);
        const shortlistTotal = Object.values(shortlistCounts).reduce((a, b) => a + b, 0);
        const historyTotal = Object.values(historyCounts).reduce((a, b) => a + b, 0);
        setShortlistCount(shortlistTotal);
        setHistoryCount(historyTotal);
      } catch (err) {
        // counts are non-critical, ignore errors
      }
    };
    fetchCounts();
  }, [id, tabRefreshKey]);

  useEffect(() => {
    const fetchWarranty = async () => {
      if (!id) return;
      try {
        const warranties = await apiService.getWarrantiesByJob(Number(id));
        setWarranty(warranties.length > 0 ? warranties[0] : null);
      } catch (err) {
        // warranty is non-critical, ignore errors
      }
    };
    fetchWarranty();
  }, [id, tabRefreshKey]);

  const handleStatusChange = async (action: 'activate' | 'pause' | 'close') => {
    if (!job?.id) return;

    setActionLoading(true);
    try {
      switch (action) {
        case 'activate':
          await apiService.activateJob(job.id);
          addToast({ type: 'success', title: 'Vaga ativada com sucesso' });
          break;
        case 'pause':
          await apiService.pauseJob(job.id);
          addToast({ type: 'success', title: 'Vaga pausada com sucesso' });
          break;
        case 'close':
          if (closingFinalValue) {
            await apiService.updateJob(job.id, { ...job, finalValue: parseFloat(closingFinalValue) } as any);
          }
          await apiService.closeJob(job.id);
          addToast({ type: 'success', title: 'Vaga fechada com sucesso' });
          setClosingFinalValue('');
          break;
      }

      // Refresh job data
      const updatedJob = await apiService.getJobById(job.id);
      setJob(updatedJob);
    } catch (err) {
      const label =
        action === 'activate' ? 'ativar' : action === 'pause' ? 'pausar' : 'fechar';
      setError(`Erro ao ${label} a vaga`);
      addToast({
        type: 'error',
        title: `Erro ao ${label} vaga`,
      });
    } finally {
      setActionLoading(false);
      setConfirmModal(null);
    }
  };

  const handleConfirmAction = () => {
    if (!confirmModal) return;
    handleStatusChange(confirmModal.action as 'activate' | 'pause' | 'close');
  };

  const formatJobType = (type: string) => {
    const types = {
      'FULL_TIME': 'Tempo Integral',
      'PART_TIME': 'Meio Período',
      'CONTRACT': 'Contrato',
      'INTERNSHIP': 'Estágio',
      'FREELANCE': 'Freelance',
    };
    return types[type as keyof typeof types] || type;
  };

  const formatWorkMode = (mode: string) => {
    const modes = {
      'REMOTE': 'Remoto',
      'ONSITE': 'Presencial',
      'HYBRID': 'Híbrido',
    };
    return modes[mode as keyof typeof modes] || mode;
  };

  const formatExperienceLevel = (level: string) => {
    const levels = {
      'ENTRY': 'Iniciante',
      'JUNIOR': 'Júnior',
      'MID': 'Pleno',
      'SENIOR': 'Sênior',
      'LEAD': 'Lead/Especialista',
    };
    return levels[level as keyof typeof levels] || level;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header skeleton */}
          <Card>
            <CardBody>
              <SkeletonText lines={3} />
            </CardBody>
          </Card>
          {/* Content skeleton */}
          <Card>
            <CardBody>
              <SkeletonText lines={6} />
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <SkeletonText lines={4} />
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            title="Erro ao carregar vaga"
            description={error}
            actionLabel="Voltar para Vagas"
            onAction={() => navigate('/jobs')}
          />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            title="Vaga não encontrada"
            description="A vaga que você está procurando não existe ou foi removida."
            actionLabel="Voltar para Vagas"
            onAction={() => navigate('/jobs')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              icon={backArrowSVG}
              onClick={() => navigate('/jobs')}
            >
              Voltar para Vagas
            </Button>
          </div>

          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">
                {job.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                {job.clientId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/clients/${job.clientId}`)}
                    className="text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {job.companyName}
                  </button>
                ) : (
                  <span>{job.companyName}</span>
                )}
                {job.location && ` • ${job.location}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Badge variant={getStatusBadgeVariant(job.status)} dot>
              {getStatusLabel(job.status)}
            </Badge>
            {job.featured && (
              <Badge variant="featured">Destaque</Badge>
            )}
            {job.urgent && (
              <Badge variant="urgent">Urgente</Badge>
            )}
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddActivity(true)}
            >
              Adicionar Atividade
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSendCandidates(true)}
            >
              Enviar Candidatos
            </Button>
            {userRole === 'admin' && (
              <>
                {job.status === 'ACTIVE' && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={actionLoading}
                    onClick={() => setConfirmModal({ action: 'pause', jobId: job.id! })}
                  >
                    Pausar Vaga
                  </Button>
                )}
                {job.status === 'PAUSED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={actionLoading}
                    onClick={() => setConfirmModal({ action: 'activate', jobId: job.id! })}
                  >
                    Ativar Vaga
                  </Button>
                )}
                {job.status !== 'CLOSED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    loading={actionLoading}
                    onClick={() => setConfirmModal({ action: 'close', jobId: job.id! })}
                  >
                    Fechar Vaga
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
          <nav className="flex gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('detalhes')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'detalhes'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Detalhes
            </button>
            <button
              onClick={() => setActiveTab('candidatos')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 flex items-center gap-1.5 ${
                activeTab === 'candidatos'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Candidatos Enviados
              {shortlistCount > 0 && (
                <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  activeTab === 'candidatos'
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {shortlistCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 flex items-center gap-1.5 ${
                activeTab === 'historico'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Historico
              {historyCount > 0 && (
                <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  activeTab === 'historico'
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {historyCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab: Candidatos */}
        {activeTab === 'candidatos' && (
          <JobApplicationsList jobId={job.id!} />
        )}

        {/* Tab: Historico */}
        {activeTab === 'historico' && (
          <JobTimeline
            jobId={job.id!}
            onAddActivity={() => setShowAddActivity(true)}
            refreshKey={tabRefreshKey}
          />
        )}

        {/* Tab: Detalhes */}
        {activeTab === 'detalhes' && (
        <div className="space-y-6">
          {/* Company Info */}
          {job.companyName && (
            <Card hover>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex-shrink-0">
                      <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
                        {job.companyName}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {job.client?.industry && <span>{job.client.industry}</span>}
                        {job.client?.city && job.client?.state && (
                          <span>{job.client.city}, {job.client.state}</span>
                        )}
                        {job.client?.contactEmail && <span>{job.client.contactEmail}</span>}
                        {job.client?.contactPhone && <span>{job.client.contactPhone}</span>}
                      </div>
                    </div>
                  </div>
                  {job.clientId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/clients/${job.clientId}`)}
                    >
                      Ver Empresa
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Gestor / Contato */}
          {job.client?.contactPersonName && (
            <Card hover>
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex-shrink-0">
                    <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
                      Gestor / Contato
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{job.client.contactPersonName}</span>
                      {job.client.contactEmail && (
                        <a href={`mailto:${job.client.contactEmail}`} className="text-brand-500 hover:underline">
                          {job.client.contactEmail}
                        </a>
                      )}
                      {job.client.contactPhone && <span>{job.client.contactPhone}</span>}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Warranty Section */}
          {warranty && (
            <Card hover>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
                    Garantia
                  </h2>
                  {(warranty.status === WarrantyStatus.ACTIVE || warranty.status === WarrantyStatus.EXPIRING_SOON) && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowBreachModal(true)}
                    >
                      Registrar Breach
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        warranty.status === WarrantyStatus.ACTIVE
                          ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400'
                          : warranty.status === WarrantyStatus.EXPIRING_SOON
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400'
                          : warranty.status === WarrantyStatus.EXPIRED
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          : warranty.status === WarrantyStatus.BREACHED
                          ? 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400'
                      }`}>
                        {warranty.status === WarrantyStatus.ACTIVE ? 'Ativa'
                          : warranty.status === WarrantyStatus.EXPIRING_SOON ? 'Expirando'
                          : warranty.status === WarrantyStatus.EXPIRED ? 'Expirada'
                          : warranty.status === WarrantyStatus.BREACHED ? 'Quebrada'
                          : 'Pendente'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Dias Restantes
                    </span>
                    <p className={`mt-0.5 font-semibold ${
                      (warranty.daysRemaining ?? 0) <= 0
                        ? 'text-red-600 dark:text-red-400'
                        : (warranty.daysRemaining ?? 0) <= 10
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-900 dark:text-white/90'
                    }`}>
                      {warranty.daysRemaining !== undefined && warranty.daysRemaining !== null
                        ? `${Math.max(0, warranty.daysRemaining)} dias`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Período
                    </span>
                    <p className="text-gray-900 dark:text-white/90 mt-0.5">
                      {new Date(warranty.startDate).toLocaleDateString('pt-BR')}
                      {' — '}
                      {new Date(warranty.endDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                {warranty.breachReason && (
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Motivo da Quebra
                    </span>
                    <p className="text-gray-900 dark:text-white/90 mt-0.5">
                      {warranty.breachReason}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Basic Information */}
          <Card hover>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
                Informações da Vaga
              </h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tipo de Contrato
                  </span>
                  <p className="text-gray-900 dark:text-white/90 mt-0.5">
                    {formatJobType(job.jobType)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Modalidade
                  </span>
                  <p className="text-gray-900 dark:text-white/90 mt-0.5">
                    {formatWorkMode(job.workMode)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nível de Experiência
                  </span>
                  <p className="text-gray-900 dark:text-white/90 mt-0.5">
                    {formatExperienceLevel(job.experienceLevel)}
                  </p>
                </div>
              </div>

              {(job.minSalary || job.maxSalary) && (
                <div className="mb-6">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Faixa Salarial
                  </span>
                  <p className="text-gray-900 dark:text-white/90 mt-0.5">
                    {job.minSalary ? `R$ ${job.minSalary.toLocaleString()}` : ''}
                    {job.minSalary && job.maxSalary ? ' - ' : ''}
                    {job.maxSalary ? `R$ ${job.maxSalary.toLocaleString()}` : ''}
                  </p>
                </div>
              )}

              {job.applicationDeadline && (
                <div className="mb-6">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Prazo para Candidatura
                  </span>
                  <p className="text-gray-900 dark:text-white/90 mt-0.5">
                    {new Date(job.applicationDeadline).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Descrição
                </span>
                <div className="mt-2 text-gray-900 dark:text-white/90 whitespace-pre-line leading-relaxed">
                  {job.description}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Skills */}
          {job.skills && (
            <Card hover>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
                  Habilidades Requeridas
                </h2>
              </CardHeader>
              <CardBody>
                <div className="text-gray-900 dark:text-white/90 whitespace-pre-line leading-relaxed">
                  {job.skills}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Benefits */}
          {job.benefits && (
            <Card hover>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
                  Benefícios
                </h2>
              </CardHeader>
              <CardBody>
                <div className="text-gray-900 dark:text-white/90 whitespace-pre-line leading-relaxed">
                  {job.benefits}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Timestamps */}
          <Card hover>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">
                Informações Adicionais
              </h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {job.createdAt && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Criado em
                    </span>
                    <p className="text-gray-900 dark:text-white/90 mt-0.5">
                      {new Date(job.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                {job.updatedAt && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Última atualização
                    </span>
                    <p className="text-gray-900 dark:text-white/90 mt-0.5">
                      {new Date(job.updatedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
        )}
      </div>

      {/* Warranty breach modal */}
      {warranty && (
        <WarrantyBreachModal
          warrantyId={warranty.id}
          isOpen={showBreachModal}
          onClose={() => setShowBreachModal(false)}
          onSuccess={() => setTabRefreshKey((k) => k + 1)}
        />
      )}

      {/* Activity and shortlist modals */}
      <AddActivityModal
        jobId={job.id!}
        isOpen={showAddActivity}
        onClose={() => setShowAddActivity(false)}
        onSuccess={() => setTabRefreshKey((k) => k + 1)}
      />
      <SendCandidatesModal
        jobId={job.id!}
        isOpen={showSendCandidates}
        onClose={() => setShowSendCandidates(false)}
        onSuccess={() => setTabRefreshKey((k) => k + 1)}
      />

      {/* Confirmation Modal for destructive actions */}
      <Modal
        isOpen={confirmModal !== null}
        onClose={() => { setConfirmModal(null); setClosingFinalValue(''); }}
        title={
          confirmModal?.action === 'close'
            ? 'Fechar Vaga'
            : confirmModal?.action === 'pause'
            ? 'Pausar Vaga'
            : 'Ativar Vaga'
        }
        description={
          confirmModal?.action === 'close'
            ? 'Informe o valor final da vaga e confirme o fechamento.'
            : confirmModal?.action === 'pause'
            ? 'Tem certeza que deseja pausar esta vaga? Ela ficará invisível para candidatos.'
            : 'Tem certeza que deseja ativar esta vaga? Ela ficará visível para candidatos.'
        }
        confirmLabel={
          confirmModal?.action === 'close'
            ? 'Fechar Vaga'
            : confirmModal?.action === 'pause'
            ? 'Pausar Vaga'
            : 'Ativar Vaga'
        }
        cancelLabel="Cancelar"
        onConfirm={handleConfirmAction}
        variant={confirmModal?.action === 'close' ? 'danger' : 'default'}
        loading={actionLoading}
      >
        {confirmModal?.action === 'close' && (
          <div className="mt-4 space-y-3">
            {job?.jobValue && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Valor previsto:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(job.jobValue)}
                </span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor final da vaga (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 8500.00"
                value={closingFinalValue}
                onChange={(e) => setClosingFinalValue(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JobDetailView;
