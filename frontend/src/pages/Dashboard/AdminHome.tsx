import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardBody, CardHeader, SkeletonStatCard } from "../../components/ui";
import { useClientFilter } from "../../context/ClientFilterContext";
import { useHeadhunterFilter } from "../../context/HeadhunterFilterContext";
import apiService from "../../services/api";
import {
  CandidateDTO,
  ClientDTO,
  HeadhunterDTO,
  JobDTO,
  JobFilters,
  JobHistoryDTO,
  ShortlistDTO,
  WarrantyDTO,
  WarrantyStatus,
} from "../../types/api";
import { ActivityDigest, ActivityEvent, buildActivityFeed, buildDigest } from "./activityFeed";
import { RecentActivityCard } from "./RecentActivityCard";

interface DashboardStats {
  totalHeadhunters: number;
  activeJobs: number;
  totalCandidates: number;
  totalClients: number;
}

const ACTIVITY_WINDOW_DAYS = 30;
const RECENT_JOBS_FOR_HISTORY = 30;

async function fetchScopedJobs(
  selectedClientId: number | null,
  selectedHeadhunterId: number | null,
): Promise<JobDTO[]> {
  const filters: JobFilters = {};
  if (selectedClientId) filters.clientId = selectedClientId;
  const page = await apiService.getJobs({ page: 0, size: 500 }, filters);
  let jobs = page.content;
  if (selectedHeadhunterId) {
    jobs = jobs.filter((j) => j.headhunterId === selectedHeadhunterId);
  }
  return jobs;
}

async function fetchHistoryForJobs(jobs: JobDTO[]): Promise<JobHistoryDTO[]> {
  const ids = jobs
    .map((j) => j.id)
    .filter((id): id is number => id !== undefined)
    .slice(0, RECENT_JOBS_FOR_HISTORY);
  if (ids.length === 0) return [];
  const results = await Promise.all(
    ids.map((id) => apiService.getJobHistory(id).catch(() => [] as JobHistoryDTO[])),
  );
  return results.flat();
}

async function fetchShortlistsForJobs(
  jobs: JobDTO[],
): Promise<{ sl: ShortlistDTO; jobTitle?: string; clientName?: string }[]> {
  const recent = jobs.slice(0, RECENT_JOBS_FOR_HISTORY);
  if (recent.length === 0) return [];
  const results = await Promise.all(
    recent.map((j) =>
      j.id
        ? apiService.getShortlistsByJob(j.id).catch(() => [] as ShortlistDTO[])
        : Promise.resolve([] as ShortlistDTO[]),
    ),
  );
  return results.flatMap((sls, idx) =>
    sls.map((sl) => ({
      sl,
      jobTitle: recent[idx].title,
      clientName: recent[idx].client?.companyName ?? recent[idx].companyName,
    })),
  );
}

async function fetchWarranties(
  selectedClientId: number | null,
  selectedHeadhunterId: number | null,
): Promise<WarrantyDTO[]> {
  const [expiring, breached, expired] = await Promise.all([
    apiService.getWarranties(WarrantyStatus.EXPIRING_SOON).catch(() => [] as WarrantyDTO[]),
    apiService.getWarranties(WarrantyStatus.BREACHED).catch(() => [] as WarrantyDTO[]),
    apiService.getWarranties(WarrantyStatus.EXPIRED).catch(() => [] as WarrantyDTO[]),
  ]);
  let merged = [...expiring, ...breached, ...expired];
  if (selectedHeadhunterId) {
    merged = merged.filter((w) => w.headhunterId === selectedHeadhunterId);
  }
  if (selectedClientId) {
    merged = merged.filter((w) => w.clientName != null);
  }
  return merged;
}

interface FetchAllResult {
  stats: DashboardStats;
  events: ActivityEvent[];
  digest: ActivityDigest;
}

async function fetchDashboardData(
  selectedClientId: number | null,
  selectedHeadhunterId: number | null,
): Promise<FetchAllResult> {
  if (selectedClientId || selectedHeadhunterId) {
    const jobs = await fetchScopedJobs(selectedClientId, selectedHeadhunterId);

    const [histories, shortlists, warranties] = await Promise.all([
      fetchHistoryForJobs(jobs),
      fetchShortlistsForJobs(jobs),
      fetchWarranties(selectedClientId, selectedHeadhunterId),
    ]);

    const candidateIds = new Set<number>();
    const clientIds = new Set<number>();
    const headhunterIds = new Set<number>();
    jobs.forEach((j) => {
      if (j.clientId) clientIds.add(j.clientId);
      if (j.headhunterId) headhunterIds.add(j.headhunterId);
    });
    shortlists.forEach((s) => candidateIds.add(s.sl.candidateId));

    const events = buildActivityFeed({
      histories,
      warranties,
      shortlists,
      newJobs: jobs,
      newCandidates: [],
      newClients: [],
      newHeadhunters: [],
      windowDays: ACTIVITY_WINDOW_DAYS,
    });

    return {
      stats: {
        activeJobs: jobs.length,
        totalCandidates: candidateIds.size,
        totalClients: clientIds.size,
        totalHeadhunters: headhunterIds.size,
      },
      events,
      digest: buildDigest(events, 7),
    };
  }

  const [
    jobsCount,
    candidatesCount,
    clientsCount,
    headhuntersCount,
    recentJobsPage,
    recentCandidatesPage,
    recentClientsPage,
    recentHeadhuntersPage,
    warranties,
  ] = await Promise.all([
    apiService.getJobs({ page: 0, size: 1 }),
    apiService.getCandidates({ page: 0, size: 1 }),
    apiService.getClients({ page: 0, size: 1 }),
    apiService.getHeadhunters({ page: 0, size: 1 }),
    apiService.getJobs({ page: 0, size: RECENT_JOBS_FOR_HISTORY, sort: 'createdAt,desc' }),
    apiService.getCandidates({ page: 0, size: 20, sort: 'createdAt,desc' }),
    apiService.getClients({ page: 0, size: 20, sort: 'createdAt,desc' }),
    apiService.getHeadhunters({ page: 0, size: 20, sort: 'createdAt,desc' }),
    fetchWarranties(null, null),
  ]);

  const recentJobs: JobDTO[] = recentJobsPage.content;
  const recentCandidates: CandidateDTO[] = recentCandidatesPage.content;
  const recentClients: ClientDTO[] = recentClientsPage.content;
  const recentHeadhunters: HeadhunterDTO[] = recentHeadhuntersPage.content;

  const [histories, shortlists] = await Promise.all([
    fetchHistoryForJobs(recentJobs),
    fetchShortlistsForJobs(recentJobs),
  ]);

  const events = buildActivityFeed({
    histories,
    warranties,
    shortlists,
    newJobs: recentJobs,
    newCandidates: recentCandidates,
    newClients: recentClients,
    newHeadhunters: recentHeadhunters,
    windowDays: ACTIVITY_WINDOW_DAYS,
  });

  return {
    stats: {
      activeJobs: jobsCount.totalElements,
      totalCandidates: candidatesCount.totalElements,
      totalClients: clientsCount.totalElements,
      totalHeadhunters: headhuntersCount.totalElements,
    },
    events,
    digest: buildDigest(events, 7),
  };
}

export default function AdminHome() {
  const navigate = useNavigate();
  const { selectedClientId, selectedClient } = useClientFilter();
  const { selectedHeadhunterId } = useHeadhunterFilter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [digest, setDigest] = useState<ActivityDigest>({
    offersAccepted: 0,
    contractsSigned: 0,
    warrantiesExpiring: 0,
    warrantiesBreached: 0,
    interviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDashboardData(selectedClientId ?? null, selectedHeadhunterId ?? null)
      .then((result) => {
        if (cancelled) return;
        setStats(result.stats);
        setEvents(result.events);
        setDigest(result.digest);
      })
      .catch(() => {
        if (cancelled) return;
        setStats({
          totalHeadhunters: 0,
          activeJobs: 0,
          totalCandidates: 0,
          totalClients: 0,
        });
        setEvents([]);
        setDigest({
          offersAccepted: 0,
          contractsSigned: 0,
          warrantiesExpiring: 0,
          warrantiesBreached: 0,
          interviews: 0,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedClientId, selectedHeadhunterId]);

  const subtitle = selectedClient
    ? `Dados filtrados por: ${selectedClient.companyName}`
    : 'Visão geral da plataforma de recrutamento';

  if (loading && !stats) {
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

        <RecentActivityCard
          events={events}
          digest={digest}
          scopeLabel={selectedClient?.companyName}
          loading={loading}
        />
      </div>
    </div>
  );
}
