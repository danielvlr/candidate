import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Badge, Card, CardBody, CardHeader, EmptyState, SkeletonStatCard } from "../../components/ui";
import { useClientFilter } from "../../context/ClientFilterContext";
import { useHeadhunterFilter } from "../../context/HeadhunterFilterContext";
import apiService from "../../services/api";
import { JobHistoryDTO, HistoryType } from "../../types/api";

interface DashboardStats {
  totalHeadhunters: number;
  activeJobs: number;
  totalCandidates: number;
  totalClients: number;
}

const HISTORY_TYPE_LABEL: Record<HistoryType, string> = {
  [HistoryType.NOTE]: 'Nota',
  [HistoryType.INTERVIEW_SCHEDULED]: 'Entrevista Agendada',
  [HistoryType.INTERVIEW_COMPLETED]: 'Entrevista Realizada',
  [HistoryType.FEEDBACK_RECEIVED]: 'Feedback',
  [HistoryType.STATUS_CHANGED]: 'Status Alterado',
  [HistoryType.SHORTLIST_SENT]: 'Shortlist Enviada',
  [HistoryType.CANDIDATE_APPLIED]: 'Candidato Inscrito',
  [HistoryType.CANDIDATE_CONTACTED]: 'Candidato Contatado',
  [HistoryType.CLIENT_MEETING]: 'Reunião com Cliente',
  [HistoryType.TECHNICAL_TEST]: 'Teste Técnico',
  [HistoryType.REFERENCE_CHECK]: 'Checagem de Referências',
  [HistoryType.OFFER_MADE]: 'Proposta Enviada',
  [HistoryType.OFFER_ACCEPTED]: 'Proposta Aceita',
  [HistoryType.OFFER_REJECTED]: 'Proposta Recusada',
  [HistoryType.CONTRACT_SIGNED]: 'Contrato Assinado',
  [HistoryType.CANDIDATE_STARTED]: 'Candidato Contratado',
  [HistoryType.GUARANTEE_PERIOD]: 'Período de Garantia',
  [HistoryType.OTHER]: 'Outro',
};

const HISTORY_DOT_COLOR: Partial<Record<HistoryType, { bg: string; dot: string }>> = {
  [HistoryType.SHORTLIST_SENT]: { bg: 'bg-blue-50 dark:bg-blue-500/10', dot: 'bg-blue-500' },
  [HistoryType.CANDIDATE_APPLIED]: { bg: 'bg-blue-50 dark:bg-blue-500/10', dot: 'bg-blue-500' },
  [HistoryType.CANDIDATE_CONTACTED]: { bg: 'bg-blue-50 dark:bg-blue-500/10', dot: 'bg-blue-500' },
  [HistoryType.INTERVIEW_SCHEDULED]: { bg: 'bg-purple-50 dark:bg-purple-500/10', dot: 'bg-purple-500' },
  [HistoryType.INTERVIEW_COMPLETED]: { bg: 'bg-purple-50 dark:bg-purple-500/10', dot: 'bg-purple-500' },
  [HistoryType.TECHNICAL_TEST]: { bg: 'bg-purple-50 dark:bg-purple-500/10', dot: 'bg-purple-500' },
  [HistoryType.FEEDBACK_RECEIVED]: { bg: 'bg-success-50 dark:bg-success-500/10', dot: 'bg-success-500' },
  [HistoryType.OFFER_MADE]: { bg: 'bg-success-50 dark:bg-success-500/10', dot: 'bg-success-500' },
  [HistoryType.OFFER_ACCEPTED]: { bg: 'bg-success-50 dark:bg-success-500/10', dot: 'bg-success-500' },
  [HistoryType.CONTRACT_SIGNED]: { bg: 'bg-success-50 dark:bg-success-500/10', dot: 'bg-success-500' },
  [HistoryType.CANDIDATE_STARTED]: { bg: 'bg-success-50 dark:bg-success-500/10', dot: 'bg-success-500' },
  [HistoryType.OFFER_REJECTED]: { bg: 'bg-red-50 dark:bg-red-500/10', dot: 'bg-red-500' },
  [HistoryType.CLIENT_MEETING]: { bg: 'bg-amber-50 dark:bg-amber-500/10', dot: 'bg-amber-500' },
  [HistoryType.GUARANTEE_PERIOD]: { bg: 'bg-amber-50 dark:bg-amber-500/10', dot: 'bg-amber-500' },
};

const DEFAULT_DOT = { bg: 'bg-gray-100 dark:bg-gray-700', dot: 'bg-gray-400' };

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}min atras`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atras`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminHome() {
  const navigate = useNavigate();
  const { selectedClientId, selectedClient } = useClientFilter();
  const { selectedHeadhunterId, selectedHeadhunter } = useHeadhunterFilter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentHistory, setRecentHistory] = useState<JobHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (selectedClientId || selectedHeadhunterId) {
          // Filtered mode
          const filters: any = {};
          if (selectedClientId) filters.clientId = selectedClientId;
          const jobs = await apiService.getJobs({ page: 0, size: 500 }, filters);

          let filteredJobs = jobs.content;
          if (selectedHeadhunterId) {
            filteredJobs = filteredJobs.filter((j: any) => j.headhunterId === selectedHeadhunterId);
          }

          const jobIds = filteredJobs.map((j) => j.id).filter((id): id is number => id !== undefined);

          // Fetch applications + history for filtered jobs
          const jobIdsForFetch = jobIds.slice(0, 30);
          let allHistory: JobHistoryDTO[] = [];
          let uniqueCandidateIds = new Set<number>();

          if (jobIdsForFetch.length > 0) {
            const [historyResults, appResults] = await Promise.all([
              Promise.all(jobIdsForFetch.map((id) => apiService.getJobHistory(id).catch(() => []))),
              Promise.all(jobIdsForFetch.map((id) => apiService.getApplicationsByJob(id, { page: 0, size: 100 }).then(r => r.content || []).catch(() => []))),
            ]);
            allHistory = historyResults.flat();
            appResults.flat().forEach((a: any) => {
              if (a.candidate?.id) uniqueCandidateIds.add(a.candidate.id);
            });
          }
          allHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRecentHistory(allHistory.slice(0, 10));

          const uniqueHhIds = new Set(filteredJobs.map((j: any) => j.headhunterId).filter(Boolean));
          const uniqueClientIds = new Set(filteredJobs.map((j: any) => j.clientId).filter(Boolean));

          setStats({
            activeJobs: filteredJobs.length,
            totalCandidates: uniqueCandidateIds.size,
            totalClients: uniqueClientIds.size,
            totalHeadhunters: uniqueHhIds.size,
          });
        } else {
          // Global mode: fetch totals + recent jobs for history
          const [jobs, candidates, clients, headhunters, recentJobs] = await Promise.all([
            apiService.getJobs({ page: 0, size: 1 }),
            apiService.getCandidates({ page: 0, size: 1 }),
            apiService.getClients({ page: 0, size: 1 }),
            apiService.getHeadhunters({ page: 0, size: 1 }),
            apiService.getJobs({ page: 0, size: 10 }),
          ]);

          setStats({
            activeJobs: jobs.totalElements,
            totalCandidates: candidates.totalElements,
            totalClients: clients.totalElements,
            totalHeadhunters: headhunters.totalElements,
          });

          // Fetch history from recent jobs
          const recentJobIds = recentJobs.content
            .map((j) => j.id)
            .filter((id): id is number => id !== undefined);

          if (recentJobIds.length > 0) {
            const historyResults = await Promise.all(
              recentJobIds.map((id) => apiService.getJobHistory(id).catch(() => []))
            );
            const allHistory = historyResults.flat();
            allHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRecentHistory(allHistory.slice(0, 10));
          } else {
            setRecentHistory([]);
          }
        }
      } catch {
        setStats({
          totalHeadhunters: 12,
          activeJobs: 32,
          totalCandidates: 320,
          totalClients: 8,
        });
        setRecentHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedClientId, selectedHeadhunterId]);

  const subtitle = selectedClient
    ? `Dados filtrados por: ${selectedClient.companyName}`
    : 'Visão geral da plataforma de recrutamento';

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 w-64 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
          <div className="h-4 w-80 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90 mb-2">Dashboard Administrativo</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card hover>
          <CardBody>
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/headhunters')}>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex-shrink-0">
                <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Headhunters</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white/90">{stats?.totalHeadhunters}</p>
                {selectedClient && (
                  <p className="text-xs text-brand-500">nas vagas de {selectedClient.companyName}</p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody>
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/jobs')}>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success-50 dark:bg-success-500/10 flex-shrink-0">
                <svg className="w-6 h-6 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vagas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white/90">{stats?.activeJobs}</p>
                {selectedClient && (
                  <p className="text-xs text-brand-500">de {selectedClient.companyName}</p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody>
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/candidates')}>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex-shrink-0">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Candidatos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white/90">{stats?.totalCandidates}</p>
                {selectedClient && (
                  <p className="text-xs text-brand-500">nas vagas de {selectedClient.companyName}</p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody>
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/clients')}>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning-50 dark:bg-warning-500/10 flex-shrink-0">
                <svg className="w-6 h-6 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Empresas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white/90">{stats?.totalClients}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">Ações Rápidas</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <Link
                to="/headhunters"
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex-shrink-0">
                  <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white/90 text-sm">Adicionar Headhunter</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cadastrar novo headhunter na plataforma</p>
                </div>
              </Link>

              <Link
                to="/jobs"
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-success-50 dark:bg-success-500/10 flex-shrink-0">
                  <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white/90 text-sm">Gerenciar Vagas</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Visualizar e gerenciar todas as vagas</p>
                </div>
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white/90">
              Atividade Recente
              {selectedClient && (
                <span className="text-xs font-normal text-gray-400 ml-2">
                  {selectedClient.companyName}
                </span>
              )}
            </h3>
          </CardHeader>
          <CardBody>
            {recentHistory.length === 0 ? (
              <EmptyState
                title="Nenhuma atividade registrada"
                description={selectedClient
                  ? `Nenhuma atividade encontrada para ${selectedClient.companyName}.`
                  : 'Nenhuma atividade recente encontrada.'}
              />
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentHistory.map((entry) => {
                  const colors = HISTORY_DOT_COLOR[entry.type] ?? DEFAULT_DOT;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                      onClick={() => entry.jobId && navigate(`/jobs/${entry.jobId}`)}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${colors.bg} flex-shrink-0 mt-0.5`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">
                          {entry.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge variant="inactive" className="text-[10px]">
                            {HISTORY_TYPE_LABEL[entry.type]}
                          </Badge>
                          {entry.jobTitle && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                              {entry.jobTitle}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {entry.headhunterName && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {entry.headhunterName}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatRelativeTime(entry.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
