import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { JobHistoryDTO } from '../../types/api';
import { useHeadhunterFilter } from '../../context/HeadhunterFilterContext';
import { useClientFilter } from '../../context/ClientFilterContext';
import {
  Badge,
  Card,
  CardHeader,
  CardBody,
  EmptyState,
  SkeletonCard,
  SkeletonStatCard,
} from '../../components/ui';

interface OpenJob {
  id: number;
  title: string;
  companyName: string;
  createdAt: string;
  daysOpen: number;
  lastDeliveryAt?: string;
  applicationsCount: number;
}

interface ClosedJob {
  id: number;
  title: string;
  companyName: string;
  closedAt: string;
  jobValue?: number;
  guaranteeDays: number;
  daysUntilGuaranteeEnd: number;
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR');

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function HeadhunterDashboard() {
  const navigate = useNavigate();
  const { selectedHeadhunterId } = useHeadhunterFilter();
  const { selectedClientId } = useClientFilter();
  const [openJobs, setOpenJobs] = useState<OpenJob[]>([]);
  const [closedJobs, setClosedJobs] = useState<ClosedJob[]>([]);
  const [recentHistory, setRecentHistory] = useState<(JobHistoryDTO & { jobTitle?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getJobs({ page: 0, size: 200 })
      .then(async (res) => {
        let jobs = res.content || [];
        if (selectedHeadhunterId) {
          jobs = jobs.filter((j: any) => j.headhunterId === selectedHeadhunterId);
        }
        if (selectedClientId) {
          jobs = jobs.filter((j: any) => j.clientId === selectedClientId);
        }
        const open = jobs.filter((j: any) => j.status === 'ACTIVE' || j.status === 'DRAFT' || j.status === 'PAUSED').map((j: any) => ({
          id: j.id, title: j.title, companyName: j.companyName, createdAt: j.createdAt,
          daysOpen: Math.floor((Date.now() - new Date(j.createdAt).getTime()) / 86400000),
          applicationsCount: j.applicationsCount || 0,
        }));
        setOpenJobs(open);
        setClosedJobs(jobs.filter((j: any) => j.status === 'CLOSED').map((j: any) => {
          const gDays = j.guaranteeDays || 90;
          const closed = j.closedAt || j.updatedAt;
          const closedDate = closed ? new Date(closed) : new Date();
          const daysElapsed = Math.floor((Date.now() - closedDate.getTime()) / 86400000);
          const remaining = Math.max(0, gDays - daysElapsed);
          return {
            id: j.id, title: j.title, companyName: j.companyName, closedAt: closed,
            jobValue: j.jobValue || 0, guaranteeDays: gDays, daysUntilGuaranteeEnd: remaining,
          };
        }));

        // Fetch history for recent jobs
        const recentJobIds = jobs.slice(0, 20).map((j: any) => j.id).filter(Boolean);
        if (recentJobIds.length > 0) {
          const histResults = await Promise.all(
            recentJobIds.map((id: number) =>
              apiService.getJobHistory(id)
                .then(h => h.map(e => ({ ...e, jobTitle: jobs.find((j: any) => j.id === id)?.title })))
                .catch(() => [])
            )
          );
          const all = histResults.flat() as (JobHistoryDTO & { jobTitle?: string })[];
          all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRecentHistory(all.slice(0, 10));
        }
      })
      .catch(err => console.error('Error loading jobs:', err))
      .finally(() => setLoading(false));
  }, [selectedHeadhunterId, selectedClientId]);

  const totalJobs = openJobs.length + closedJobs.length;
  const totalCandidates = openJobs.reduce((sum, j) => sum + j.applicationsCount, 0);
  const urgentJobs = openJobs.filter((j) => j.daysOpen > 30).length;
  const guaranteeAlert = closedJobs.filter((j) => j.daysUntilGuaranteeEnd <= 30).length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 mb-2" />
          <div className="h-4 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">
          Dashboard do Headhunter
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Acompanhe suas vagas e candidatos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
                <svg className="h-6 w-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Total Vagas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white/90">
                  {totalJobs}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Candidatos Ativos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white/90">
                  {totalCandidates}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/10">
                <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Vagas Urgentes
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white/90">
                  {urgentJobs}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50 dark:bg-success-500/10">
                <svg className="h-6 w-6 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Alerta Garantia
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white/90">
                  {guaranteeAlert}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent History */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
              Ultimas Atualizacoes
            </h2>
          </CardHeader>
          {recentHistory.length === 0 ? (
            <CardBody>
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Nenhuma atualizacao recente.</p>
            </CardBody>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentHistory.map((h, idx) => (
                <div
                  key={h.id || idx}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => navigate(`/jobs/${h.jobId}?tab=historico`)}
                >
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    h.type === 'STATUS_CHANGED' ? 'bg-blue-500' :
                    h.type === 'SHORTLIST_SENT' ? 'bg-purple-500' :
                    h.type === 'INTERVIEW_SCHEDULED' ? 'bg-amber-500' :
                    h.type === 'OFFER_MADE' ? 'bg-green-500' :
                    h.type === 'CANDIDATE_CONTACTED' ? 'bg-teal-500' :
                    'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{h.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-brand-600 dark:text-brand-400">{h.jobTitle || `Vaga #${h.jobId}`}</span>
                      <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(h.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <svg className="h-4 w-4 text-gray-300 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Open Jobs */}
      <div className="mb-8">
        <Card>
          <CardHeader
            action={
              <button
                onClick={() => navigate('/jobs')}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                Ver todas
              </button>
            }
          >
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
              Vagas em Aberto
            </h2>
          </CardHeader>

          {openJobs.length === 0 ? (
            <CardBody>
              <EmptyState
                title="Nenhuma vaga em aberto"
                description="Você não possui vagas ativas no momento."
              />
            </CardBody>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {openJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white/90">
                        {job.title}
                      </span>
                      <Badge
                        variant={
                          job.daysOpen > 30 ? 'urgent' : job.daysOpen > 15 ? 'paused' : 'active'
                        }
                      >
                        {job.daysOpen} dias
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {job.companyName} &bull; Aberta em {formatDate(job.createdAt)}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {job.applicationsCount} candidato{job.applicationsCount !== 1 ? 's' : ''}
                      </p>
                      {job.lastDeliveryAt && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Última entrega: {formatDate(job.lastDeliveryAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recently Closed Jobs */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
            Vagas Fechadas (Últimos 3 Meses)
          </h2>
        </CardHeader>

        {closedJobs.length === 0 ? (
          <CardBody>
            <EmptyState
              title="Nenhuma vaga fechada"
              description="Nenhuma vaga foi fechada nos últimos 3 meses."
            />
          </CardBody>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {closedJobs.map((job) => {
              const pct = job.guaranteeDays > 0 ? Math.max(0, Math.min(100, ((job.guaranteeDays - job.daysUntilGuaranteeEnd) / job.guaranteeDays) * 100)) : 100;
              const expired = job.daysUntilGuaranteeEnd === 0;
              const urgent = !expired && job.daysUntilGuaranteeEnd <= 10;
              const warning = !expired && !urgent && job.daysUntilGuaranteeEnd <= 30;
              return (
                <div
                  key={job.id}
                  className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">{job.title}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{job.companyName}</span>
                    </div>
                    {(job.jobValue ?? 0) > 0 && (
                      <span className="text-xs font-medium text-brand-600 dark:text-brand-400 flex-shrink-0 ml-2">{formatCurrency(job.jobValue!)}</span>
                    )}
                  </div>

                  {/* Guarantee Progress */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${expired ? 'bg-gray-400' : urgent ? 'bg-red-500' : warning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 min-w-[100px] text-right ${expired ? 'text-gray-400' : urgent ? 'text-red-600 dark:text-red-400' : warning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {expired
                        ? 'Garantia expirada'
                        : `${job.daysUntilGuaranteeEnd}/${job.guaranteeDays} dias`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      Fechada em {formatDate(job.closedAt)}
                    </span>
                    <span className="text-[10px] text-gray-300 dark:text-gray-600">·</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      Garantia: {job.guaranteeDays} dias
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
