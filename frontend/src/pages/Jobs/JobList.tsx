import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { JobDTO, PageResponse, JobFilters, PaginationParams } from '../../types/api';
import { useUserRole } from '../../context/UserRoleContext';
import { useClientFilter } from '../../context/ClientFilterContext';
import { useNavigate } from 'react-router';
import { Badge, Button, Card, CardHeader, CardBody, EmptyState, Pagination, SkeletonCard } from '../../components/ui';
import { useListSelection } from '../../hooks/useListSelection';

const JobList: React.FC = () => {
  const [jobs, setJobs] = useState<PageResponse<JobDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<JobFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const { userRole } = useUserRole();
  const { selectedClientId } = useClientFilter();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { selectedId: selectedJobId, selectedCount, handleRowClick, handleRowMouseDown, clearSelection, isSelected } = useListSelection<JobDTO>();

  const activeFilterCount = [
    filters.location,
    filters.companyName,
    filters.minSalary,
    filters.maxSalary,
  ].filter(Boolean).length;

  const fetchJobs = async (page: number = 0) => {
    try {
      setLoading(true);
      setError(null);

      const pagination: PaginationParams = {
        page,
        size: 20,
        sort: 'createdAt,desc',
      };

      let result: PageResponse<JobDTO>;

      const effectiveFilters: JobFilters = {
        ...filters,
        ...(selectedClientId ? { clientId: selectedClientId } : {}),
      };

      if (searchQuery.trim()) {
        result = await apiService.searchJobs(searchQuery, pagination);
        // Client-side filter by selected company (search endpoint doesn't support clientId)
        if (selectedClientId && result.content) {
          const filtered = result.content.filter(j => j.clientId === selectedClientId);
          result = { ...result, content: filtered, totalElements: filtered.length };
        }
      } else {
        result = await apiService.getJobs(pagination, effectiveFilters);
      }

      setJobs(result);
      setCurrentPage(page);
    } catch (err) {
      setError('Erro ao carregar vagas');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(0);
  }, [filters, searchQuery, selectedClientId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(0);
  };

  const handleActivateJob = async (id: number) => {
    try {
      await apiService.activateJob(id);
      fetchJobs(currentPage);
    } catch (err) {
      setError('Erro ao ativar vaga');
    }
  };

  const handlePauseJob = async (id: number) => {
    try {
      await apiService.pauseJob(id);
      fetchJobs(currentPage);
    } catch (err) {
      setError('Erro ao pausar vaga');
    }
  };

  const handleCloseJob = async (id: number) => {
    try {
      await apiService.closeJob(id);
      fetchJobs(currentPage);
    } catch (err) {
      setError('Erro ao fechar vaga');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">Vagas</h1>
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              className="h-12 w-12 text-error-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <p className="text-sm font-semibold text-gray-900 dark:text-white/90 mb-1">
              Erro ao carregar vagas
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchJobs(currentPage)}>
              Tentar novamente
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">Vagas</h1>
          {userRole === 'admin' && (
            <Button
              variant="primary"
              onClick={() => navigate('/jobs/create')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Criar Vaga
            </Button>
          )}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Buscar vagas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500"
            />
            <Button type="submit" variant="secondary">
              Buscar
            </Button>
          </div>
        </form>

        {/* Collapsible Filters */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white/90 transition-colors"
          >
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            Filtros
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand-500 text-white text-xs font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filtersOpen && (
            <Card className="mt-3">
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Localização
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: São Paulo"
                      value={filters.location || ''}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Empresa
                    </label>
                    <input
                      type="text"
                      placeholder="Nome da empresa"
                      value={filters.companyName || ''}
                      onChange={(e) => setFilters({ ...filters, companyName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Salário Mínimo
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 5000"
                      value={filters.minSalary || ''}
                      onChange={(e) =>
                        setFilters({ ...filters, minSalary: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Salário Máximo
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 10000"
                      value={filters.maxSalary || ''}
                      onChange={(e) =>
                        setFilters({ ...filters, maxSalary: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Results */}
      {jobs && (
        <>
          {(() => {
            const hasSelection = selectedCount > 0;
            const single = selectedCount === 1 ? jobs.content.find(j => j.id === selectedJobId) : null;
            return (
              <div className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${hasSelection ? 'bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'}`}>
                <span className={`text-sm font-medium mr-auto ${hasSelection ? 'text-brand-700 dark:text-brand-300' : 'text-gray-400 dark:text-gray-500'}`}>
                  {selectedCount > 1 ? `${selectedCount} vagas selecionadas` : single ? single.title : 'Selecione uma vaga'}
                </span>
                {userRole === 'admin' && (
                  <>
                    <Button variant="secondary" size="sm" disabled={!single || single.status !== 'ACTIVE'} onClick={() => single && handlePauseJob(single.id!)}>
                      Pausar
                    </Button>
                    <Button variant="secondary" size="sm" disabled={!single || single.status !== 'PAUSED'} onClick={() => single && handleActivateJob(single.id!)}>
                      Ativar
                    </Button>
                    <Button variant="danger" size="sm" disabled={!single || single.status === 'CLOSED'} onClick={() => single && handleCloseJob(single.id!)}>
                      Fechar
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" disabled={!single} onClick={() => single && navigate(`/jobs/${single.id}`)}>
                  Ver Detalhes
                </Button>
                <Button variant="ghost" size="sm" disabled={!hasSelection} onClick={clearSelection}>✕</Button>
              </div>
            );
          })()}
          <Card>
            <CardHeader
              action={
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {jobs.totalElements} vagas
                </span>
              }
            >
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                Resultados
              </h2>
            </CardHeader>

            {jobs.content.length === 0 ? (
              <CardBody>
                <EmptyState
                  title="Nenhuma vaga encontrada"
                  description="Tente ajustar os filtros ou a busca para encontrar vagas."
                  actionLabel={userRole === 'admin' ? 'Criar Vaga' : undefined}
                  onAction={userRole === 'admin' ? () => navigate('/jobs/create') : undefined}
                />
              </CardBody>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {jobs.content.map((job) => (
                  <div
                    key={job.id}
                    className={`flex items-start px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-shadow duration-150 hover:shadow-theme-sm${isSelected(job) ? ' ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-500/10' : ''}`}
                    onMouseDown={handleRowMouseDown}
                    onClick={(e) => handleRowClick(job, e)}
                    onDoubleClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      {/* Title + Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                          {job.title}
                        </h3>
                        {job.status === 'ACTIVE' && <Badge variant="active">Ativa</Badge>}
                        {job.status === 'PAUSED' && <Badge variant="paused">Pausada</Badge>}
                        {job.status === 'CLOSED' && <Badge variant="closed">Fechada</Badge>}
                        {job.status === 'EXPIRED' && <Badge variant="expired">Expirada</Badge>}
                        {job.status === 'DRAFT' && <Badge variant="draft">Rascunho</Badge>}
                        {job.featured && <Badge variant="featured">Destaque</Badge>}
                        {job.urgent && <Badge variant="urgent">Urgente</Badge>}
                      </div>

                      {/* Meta */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {job.clientId ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); navigate(`/clients/${job.clientId}`); }}
                              className="text-brand-600 dark:text-brand-400 hover:underline"
                            >
                              {job.companyName}
                            </button>
                            {job.location && ` • ${job.location}`}
                          </>
                        ) : (
                          [job.companyName, job.location].filter(Boolean).join(' • ')
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {[job.jobType, job.workMode, job.experienceLevel].filter(Boolean).join(' • ')}
                      </p>

                      {(job.minSalary || job.maxSalary) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Salário:{' '}
                          {job.minSalary ? `R$ ${job.minSalary.toLocaleString()}` : ''}
                          {job.minSalary && job.maxSalary ? ' - ' : ''}
                          {job.maxSalary ? `R$ ${job.maxSalary.toLocaleString()}` : ''}
                        </p>
                      )}

                      {job.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {job.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pagination */}
          {jobs.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={jobs.totalPages}
                totalElements={jobs.totalElements}
                pageSize={20}
                onPageChange={(page) => fetchJobs(page)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobList;
