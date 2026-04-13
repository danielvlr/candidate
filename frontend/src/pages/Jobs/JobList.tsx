import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../../services/api';
import { JobDTO, PageResponse, JobFilters, PaginationParams } from '../../types/api';
import { useUserRole } from '../../context/UserRoleContext';
import { useClientFilter } from '../../context/ClientFilterContext';
import { useHeadhunterFilter } from '../../context/HeadhunterFilterContext';
import { useNavigate } from 'react-router';
import { Badge, Button, Card, CardHeader, CardBody, EmptyState, Pagination, SkeletonCard } from '../../components/ui';
import { useListSelection } from '../../hooks/useListSelection';

type ViewMode = 'list' | 'kanban';
type StatusFilter = 'ACTIVE' | 'WARRANTY' | 'PAUSED' | 'CLOSED';

const STATUS_CONFIG: Record<StatusFilter, { label: string; color: string; bg: string; dot: string; kanbanBg: string }> = {
  ACTIVE:   { label: 'Ativa',    color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30', dot: 'bg-emerald-500', kanbanBg: 'bg-emerald-50/80 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/40' },
  WARRANTY: { label: 'Garantia', color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30',       dot: 'bg-blue-500',    kanbanBg: 'bg-blue-50/80 dark:bg-blue-900/10 border-blue-200/60 dark:border-blue-800/40' },
  PAUSED:   { label: 'Pausada',  color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',   dot: 'bg-amber-500',   kanbanBg: 'bg-amber-50/80 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/40' },
  CLOSED:   { label: 'Fechada',  color: 'text-gray-600 dark:text-gray-400',    bg: 'bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/30',       dot: 'bg-gray-400',    kanbanBg: 'bg-gray-50/80 dark:bg-gray-900/10 border-gray-200/60 dark:border-gray-800/40' },
};

const KANBAN_COLUMNS: StatusFilter[] = ['ACTIVE', 'WARRANTY', 'PAUSED', 'CLOSED'];

const formatDate = (d: string) => {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return '1d';
  return `${diff}d`;
};

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getLast12Months(): { key: string; label: string; from: string; to: string }[] {
  const months: { key: string; label: string; from: string; to: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const mm = String(month + 1).padStart(2, '0');
    months.push({
      key: `${year}-${mm}`,
      label: `${MONTH_LABELS[month]}${year !== now.getFullYear() ? ` ${year}` : ''}`,
      from: `${year}-${mm}-01`,
      to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
    });
  }
  return months;
}

const JobList: React.FC = () => {
  const [jobs, setJobs] = useState<PageResponse<JobDTO> | null>(null);
  const [listItems, setListItems] = useState<JobDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<JobFilters>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const fetchingRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedStatuses, setSelectedStatuses] = useState<StatusFilter[]>(['ACTIVE', 'WARRANTY', 'PAUSED', 'CLOSED']);
  const [dateMode, setDateMode] = useState<'month' | 'range'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [jobHistoryCache, setJobHistoryCache] = useState<Record<number, { type: string; title: string; createdAt: string }[]>>({});
  const { userRole } = useUserRole();
  const { selectedClientId } = useClientFilter();
  const { selectedHeadhunterId } = useHeadhunterFilter();
  const navigate = useNavigate();
  const { selectedId: selectedJobId, selectedCount, handleRowClick, handleRowMouseDown, clearSelection, isSelected } = useListSelection<JobDTO>();

  const toggleStatus = (status: StatusFilter) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleMonthSelect = (month: { key: string; from: string; to: string } | null) => {
    if (!month || selectedMonth === month.key) {
      setSelectedMonth(null);
      setDateFrom('');
      setDateTo('');
    } else {
      setSelectedMonth(month.key);
      setDateFrom(month.from);
      setDateTo(month.to);
    }
  };

  const switchToRange = () => {
    setDateMode('range');
    setSelectedMonth(null);
    setDateFrom('');
    setDateTo('');
  };

  const switchToMonth = () => {
    setDateMode('month');
    setSelectedMonth(null);
    setDateFrom('');
    setDateTo('');
  };

  const months = getLast12Months();

  const applyClientFilters = (items: JobDTO[]) => {
    let filtered = items;
    if (selectedStatuses.length > 0 && selectedStatuses.length < Object.keys(STATUS_CONFIG).length) {
      filtered = filtered.filter(j => selectedStatuses.includes(j.status as StatusFilter));
    }
    if (selectedHeadhunterId) filtered = filtered.filter(j => j.headhunterId === selectedHeadhunterId);
    if (dateFrom) filtered = filtered.filter(j => (j.createdAt || '') >= dateFrom);
    if (dateTo) filtered = filtered.filter(j => (j.createdAt || '') <= dateTo + 'T23:59:59');
    return filtered;
  };

  const fetchJobs = async (page: number = 0, append: boolean = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const pagination: PaginationParams = { page, size: viewMode === 'kanban' ? 1000 : 30, sort: 'createdAt,desc' };
      const effectiveFilters: JobFilters = { ...filters, ...(selectedClientId ? { clientId: selectedClientId } : {}) };

      let result: PageResponse<JobDTO>;
      if (searchQuery.trim()) {
        result = await apiService.searchJobs(searchQuery, pagination);
        if (selectedClientId && result.content) {
          const filtered = result.content.filter(j => j.clientId === selectedClientId);
          result = { ...result, content: filtered, totalElements: filtered.length };
        }
      } else {
        result = await apiService.getJobs(pagination, effectiveFilters);
      }

      // Apply non-status filters first for counts
      let preStatusFiltered = result.content || [];
      if (selectedHeadhunterId) preStatusFiltered = preStatusFiltered.filter(j => j.headhunterId === selectedHeadhunterId);
      if (dateFrom) preStatusFiltered = preStatusFiltered.filter(j => j.createdAt && j.createdAt >= dateFrom);
      if (dateTo) preStatusFiltered = preStatusFiltered.filter(j => j.createdAt && j.createdAt <= dateTo + 'T23:59:59');

      // Calculate counts per status BEFORE status filter
      const counts: Record<string, number> = {};
      preStatusFiltered.forEach(j => { counts[j.status as string] = (counts[j.status as string] || 0) + 1; });
      setStatusCounts(counts);

      const filtered = applyClientFilters(result.content || []);
      setJobs({ ...result, content: filtered, totalElements: filtered.length });
      setCurrentPage(page);
      setHasMore(page + 1 < result.totalPages);

      if (append) {
        setListItems(prev => [...prev, ...filtered]);
      } else {
        setListItems(filtered);
      }
    } catch (err) {
      setError('Erro ao carregar vagas');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  };

  // Reset on filter change
  useEffect(() => {
    setListItems([]);
    setCurrentPage(0);
    setHasMore(false);
    fetchJobs(0, false);
  }, [filters, searchQuery, selectedClientId, selectedHeadhunterId, selectedStatuses, viewMode, dateFrom, dateTo]);

  // Fetch history for kanban cards (only active/paused/warranty - not closed)
  useEffect(() => {
    if (viewMode !== 'kanban' || !jobs?.content?.length) return;
    const relevantJobs = jobs.content.filter(j => j.id && j.status !== 'CLOSED' && !jobHistoryCache[j.id]);
    const idsToFetch = relevantJobs.map(j => j.id!).slice(0, 200);
    if (idsToFetch.length === 0) return;
    Promise.all(idsToFetch.map(id =>
      apiService.getJobHistory(id).then(h => ({ id, history: h.filter(e => !e.title.includes('importada do Jestor')).slice(0, 3).map(e => ({ type: e.type, title: e.title, createdAt: e.createdAt })) })).catch(() => ({ id, history: [] }))
    )).then(results => {
      setJobHistoryCache(prev => {
        const next = { ...prev };
        results.forEach(r => { next[r.id] = r.history; });
        return next;
      });
    });
  }, [viewMode, jobs?.content?.length]);

  // Infinite scroll sentinel
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node || viewMode !== 'list') return;
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !fetchingRef.current) {
        fetchJobs(currentPage + 1, true);
      }
    }, { rootMargin: '300px' });
    observerRef.current.observe(node);
  }, [hasMore, currentPage, viewMode]);

  const handleDrop = async (jobId: number, targetStatus: string) => {
    try { await apiService.updateJobStatus(jobId, targetStatus); fetchJobs(0); } catch { setError('Erro ao mover vaga'); }
  };

  if (loading && !jobs) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  const totalFiltered = jobs?.totalElements || 0;
  const totalAll = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-0">
      {/* Compact Toolbar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 sticky top-0 z-10">
        {/* Row 1: Title + Actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Vagas</h1>
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-0.5">
              {totalFiltered}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Search inline */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs w-48 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder-gray-500 transition-all focus:w-64"
              />
            </div>

            {/* View Toggle */}
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button onClick={() => setViewMode('kanban')} title="Kanban"
                className={`p-1.5 transition-colors ${viewMode === 'kanban' ? 'bg-brand-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
              </button>
              <button onClick={() => setViewMode('list')} title="Lista"
                className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-brand-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              </button>
            </div>

            {userRole === 'admin' && (
              <Button variant="primary" size="sm" onClick={() => navigate('/jobs/create')}
                icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
                Nova Vaga
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Status chips */}
          <div className="flex items-center gap-1.5">
            {(Object.entries(STATUS_CONFIG) as [StatusFilter, typeof STATUS_CONFIG.ACTIVE][]).map(([key, cfg]) => {
              const active = selectedStatuses.includes(key);
              const count = statusCounts[key] || 0;
              return (
                <button key={key} onClick={() => toggleStatus(key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${active ? cfg.bg + ' ' + cfg.color : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? cfg.dot : 'bg-gray-300 dark:bg-gray-600'}`} />
                  {cfg.label}
                  {active && count > 0 && <span className="opacity-60">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

          {/* Date filter */}
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>

            {dateMode === 'month' ? (
              <>
                {months.slice(0, 6).map((m) => (
                  <button key={m.key} onClick={() => handleMonthSelect(m)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      selectedMonth === m.key
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}>
                    {m.label}
                  </button>
                ))}
                <button onClick={switchToRange} title="Periodo personalizado"
                  className="px-1.5 py-0.5 rounded text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-0.5 text-[11px] border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 w-28" />
                <span className="text-[11px] text-gray-300 dark:text-gray-600">ate</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-0.5 text-[11px] border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 w-28" />
                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
                <button onClick={switchToMonth} title="Voltar para meses"
                  className="px-1.5 py-0.5 rounded text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* More filters toggle */}
          <button onClick={() => setFiltersOpen(v => !v)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${filtersOpen ? 'bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/30 text-brand-600' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            Filtros
          </button>
        </div>

        {/* Expanded filters */}
        {filtersOpen && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-4 gap-3">
            <input type="text" placeholder="Localizacao" value={filters.location || ''} onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder-gray-500" />
            <input type="text" placeholder="Empresa" value={filters.companyName || ''} onChange={(e) => setFilters({ ...filters, companyName: e.target.value })}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder-gray-500" />
            <input type="number" placeholder="Salario min" value={filters.minSalary || ''} onChange={(e) => setFilters({ ...filters, minSalary: Number(e.target.value) })}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder-gray-500" />
            <input type="number" placeholder="Salario max" value={filters.maxSalary || ''} onChange={(e) => setFilters({ ...filters, maxSalary: Number(e.target.value) })}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder-gray-500" />
          </div>
        )}
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && jobs && (
        <div className="flex gap-3 p-4 overflow-x-auto min-h-[calc(100vh-200px)]">
          {KANBAN_COLUMNS.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const columnJobs = (jobs.content || []).filter(j => j.status === status).sort((a, b) => {
              if (status === 'ACTIVE') {
                // Sort by last history date (oldest first = least recent activity on top)
                const aHist = a.id && jobHistoryCache[a.id]?.[0]?.createdAt;
                const bHist = b.id && jobHistoryCache[b.id]?.[0]?.createdAt;
                const aDate = aHist || a.createdAt || '';
                const bDate = bHist || b.createdAt || '';
                return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
              }
              if (status === 'CLOSED') {
                // Sort by guarantee days remaining DESC (most days remaining first)
                const calcRemaining = (j: JobDTO) => {
                  const gDays = (j as any).guaranteeDays || 90;
                  const closed = (j as any).closedAt || j.updatedAt || j.createdAt;
                  if (!closed) return 0;
                  const daysElapsed = Math.floor((Date.now() - new Date(closed).getTime()) / 86400000);
                  return Math.max(0, gDays - daysElapsed);
                };
                return calcRemaining(b) - calcRemaining(a);
              }
              return 0;
            });
            return (
              <div key={status}
                className={`flex-shrink-0 w-80 rounded-xl border ${cfg.kanbanBg} flex flex-col`}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-brand-400'); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-brand-400'); }}
                onDrop={(e) => {
                  e.currentTarget.classList.remove('ring-2', 'ring-brand-400');
                  const jobId = Number(e.dataTransfer.getData('jobId'));
                  if (jobId) handleDrop(jobId, status);
                }}>
                {/* Column Header */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200/50 dark:border-gray-700/50">
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  <span className="ml-auto text-xs font-medium text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-gray-800/80 rounded px-1.5 py-0.5">{columnJobs.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-260px)]">
                  {columnJobs.map((job) => (
                    <div key={job.id} draggable
                      onDragStart={(e) => { e.dataTransfer.setData('jobId', String(job.id)); e.currentTarget.classList.add('opacity-50', 'rotate-1'); }}
                      onDragEnd={(e) => { e.currentTarget.classList.remove('opacity-50', 'rotate-1'); }}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all group">
                      {/* Title */}
                      <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {job.title}
                      </p>

                      {/* Company + Location */}
                      <div className="flex items-center gap-1 mt-1.5">
                        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.companyName || 'Sem empresa'}</span>
                      </div>

                      {/* Guarantee bar for closed jobs */}
                      {status === 'CLOSED' && (() => {
                        const gDays = (job as any).guaranteeDays || 90;
                        const closed = (job as any).closedAt || job.updatedAt || job.createdAt;
                        if (!closed) return null;
                        const daysElapsed = Math.floor((Date.now() - new Date(closed).getTime()) / 86400000);
                        const remaining = Math.max(0, gDays - daysElapsed);
                        const pct = Math.max(0, Math.min(100, (daysElapsed / gDays) * 100));
                        const expired = remaining <= 0;
                        const urgent = !expired && remaining <= 10;
                        return (
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${expired ? 'bg-gray-400' : urgent ? 'bg-red-500' : remaining <= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className={`text-[10px] font-bold flex-shrink-0 ${expired ? 'text-gray-400' : urgent ? 'text-red-500' : remaining <= 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {expired ? 'Expirada' : `${remaining}/${gDays}d`}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* HH + Date */}
                      <div className="flex items-center justify-between mt-1.5">
                        {job.headhunterName ? (
                          <div className="flex items-center gap-1 min-w-0">
                            <div className="w-4 h-4 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-[8px] font-bold text-brand-600 dark:text-brand-400">
                                {job.headhunterName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{job.headhunterName.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 dark:text-gray-600">Sem HH</span>
                        )}
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0" title={(() => {
                          const lastHist = job.id && jobHistoryCache[job.id]?.[0]?.createdAt;
                          return lastHist ? `Ultima atividade: ${new Date(lastHist).toLocaleString('pt-BR')}` : '';
                        })()}>
                          {(() => {
                            const lastHist = job.id && jobHistoryCache[job.id]?.[0]?.createdAt;
                            if (lastHist) return formatDate(lastHist);
                            if (job.startDate) return formatDate(job.startDate);
                            return '';
                          })()}
                        </span>
                      </div>

                      {/* History (last 3) */}
                      {job.id && jobHistoryCache[job.id] && jobHistoryCache[job.id].length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 space-y-1">
                          {jobHistoryCache[job.id].map((h, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className={`w-1 h-1 rounded-full flex-shrink-0 ${
                                h.type === 'STATUS_CHANGED' ? 'bg-blue-400' :
                                h.type === 'SHORTLIST_SENT' ? 'bg-purple-400' :
                                h.type === 'INTERVIEW_SCHEDULED' ? 'bg-amber-400' :
                                'bg-gray-300'
                              }`} />
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate flex-1">{h.title}</span>
                              <span className="text-[9px] text-gray-300 dark:text-gray-600 flex-shrink-0">{formatDate(h.createdAt)}</span>
                            </div>
                          ))}
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}?tab=historico`); }}
                            className="text-[10px] text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium">
                            Ver historico completo
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {columnJobs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center mb-2`}>
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Nenhuma vaga</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && jobs && (
        <div className="p-6">
          {(() => {
            const hasSelection = selectedCount > 0;
            const single = selectedCount === 1 ? jobs.content.find(j => j.id === selectedJobId) : null;
            return (
              <div className={`mb-4 flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 ${hasSelection ? 'bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'}`}>
                <span className={`text-xs font-medium mr-auto ${hasSelection ? 'text-brand-700 dark:text-brand-300' : 'text-gray-400 dark:text-gray-500'}`}>
                  {selectedCount > 1 ? `${selectedCount} selecionadas` : single ? single.title : 'Selecione uma vaga'}
                </span>
                {userRole === 'admin' && (
                  <>
                    <Button variant="secondary" size="sm" disabled={!single || single.status !== 'ACTIVE'} onClick={() => single && apiService.pauseJob(single.id!).then(() => fetchJobs(currentPage))}>Pausar</Button>
                    <Button variant="secondary" size="sm" disabled={!single || single.status !== 'PAUSED'} onClick={() => single && apiService.activateJob(single.id!).then(() => fetchJobs(currentPage))}>Ativar</Button>
                    <Button variant="danger" size="sm" disabled={!single || single.status === 'CLOSED'} onClick={() => single && apiService.closeJob(single.id!).then(() => fetchJobs(currentPage))}>Fechar</Button>
                  </>
                )}
                <Button variant="ghost" size="sm" disabled={!single} onClick={() => single && navigate(`/jobs/${single.id}`)}>Detalhes</Button>
                {hasSelection && <Button variant="ghost" size="sm" onClick={clearSelection}>✕</Button>}
              </div>
            );
          })()}

          <Card>
            <CardHeader action={<span className="text-xs text-gray-500">{totalFiltered} vagas</span>}>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">Resultados</h2>
            </CardHeader>
            {listItems.length === 0 && !loading ? (
              <CardBody>
                <EmptyState title="Nenhuma vaga" description="Ajuste os filtros." actionLabel={userRole === 'admin' ? 'Nova Vaga' : undefined} onAction={userRole === 'admin' ? () => navigate('/jobs/create') : undefined} />
              </CardBody>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {listItems.map((job) => {
                  const sCfg = STATUS_CONFIG[job.status as StatusFilter];
                  return (
                    <div key={job.id}
                      className={`flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all${isSelected(job) ? ' ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-500/10' : ''}`}
                      onMouseDown={handleRowMouseDown} onClick={(e) => handleRowClick(job, e)} onDoubleClick={() => navigate(`/jobs/${job.id}`)}>
                      {/* Status dot */}
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sCfg?.dot || 'bg-gray-400'}`} />

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">{job.title}</h3>
                          {sCfg && <span className={`text-[10px] font-medium ${sCfg.color}`}>{sCfg.label}</span>}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {job.clientId ? (
                            <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/clients/${job.clientId}`); }} className="text-brand-600 dark:text-brand-400 hover:underline">{job.companyName}</button>
                          ) : job.companyName}
                          {job.location && <span className="text-gray-300 dark:text-gray-600"> / </span>}
                          {job.location}
                        </p>
                      </div>

                      {/* HH avatar */}
                      {job.headhunterName && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400">{job.headhunterName.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">{job.headhunterName.split(' ')[0]}</span>
                        </div>
                      )}

                      {/* Date */}
                      {job.createdAt && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 w-12 text-right">{formatDate(job.createdAt)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-500" />
            </div>
          )}
          {!hasMore && listItems.length > 0 && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-3">Todas as vagas carregadas</p>
          )}
        </div>
      )}
    </div>
  );
};

export default JobList;
