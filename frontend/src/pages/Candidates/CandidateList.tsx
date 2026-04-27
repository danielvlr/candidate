import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { CandidateDTO, PageResponse, CandidateFilters, PaginationParams } from '../../types/api';
import { Badge, Button, Card, CardHeader, CardBody, EmptyState, Pagination, SkeletonCard } from '../../components/ui';
import { useListSelection } from '../../hooks/useListSelection';
import { useClientFilter } from '../../context/ClientFilterContext';
import InviteCandidateModal from '../../components/candidate/InviteCandidateModal';

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

const statusLabel: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  HIRED: 'Contratado',
  BLACKLISTED: 'Bloqueado',
  INVITED: 'Convite enviado',
  PENDING_APPROVAL: 'Aguardando aprovação',
  REJECTED: 'Rejeitado',
  EXPIRED_INVITE: 'Convite expirado',
};

const statusVariant: Record<string, string> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  HIRED: 'hired',
  BLACKLISTED: 'blacklisted',
  INVITED: 'draft',
  PENDING_APPROVAL: 'paused',
  REJECTED: 'blacklisted',
  EXPIRED_INVITE: 'closed',
};

const originLabel: Record<string, string> = {
  MANUAL: 'Manual',
  JESTOR: 'Jestor',
  SELF_REGISTERED: 'Auto-cadastro',
};

const originVariant: Record<string, string> = {
  MANUAL: 'info',
  JESTOR: 'featured',
  SELF_REGISTERED: 'draft',
};

const CandidateList: React.FC = () => {
  const navigate = useNavigate();
  const { selectedClientId } = useClientFilter();
  const { selectedId: selectedCandidateId, selectedCount, handleRowClick, handleRowMouseDown, clearSelection, isSelected } = useListSelection<CandidateDTO>();
  const [candidates, setCandidates] = useState<PageResponse<CandidateDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<CandidateFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const activeFilterCount = [filters.headline, filters.city, filters.minSalary]
    .filter(Boolean).length;

  const fetchCandidates = async (page: number = 0) => {
    try {
      setLoading(true);
      setError(null);

      if (selectedClientId) {
        // Filtered mode: get candidates via job applications of the selected client.
        // Headhunter combobox does NOT filter candidates — they are a global pool.
        const jobFilters: any = { clientId: selectedClientId };
        const jobsResult = await apiService.getJobs({ page: 0, size: 500 }, jobFilters);
        const jobs = jobsResult.content || [];
        const jobIds = jobs.map((j: any) => j.id).filter(Boolean).slice(0, 50);

        const candidateIds = new Set<number>();
        if (jobIds.length > 0) {
          const appResults = await Promise.all(
            jobIds.map((id: number) => apiService.getApplicationsByJob(id, { page: 0, size: 100 }).then(r => r.content || []).catch(() => []))
          );
          appResults.flat().forEach((a: any) => {
            if (a.candidate?.id) candidateIds.add(a.candidate.id);
          });
        }

        // Fetch all candidates and filter by IDs
        const allCandidates = await apiService.getCandidates({ page: 0, size: 500 }, filters);
        const filtered = (allCandidates.content || []).filter(c => c.id && candidateIds.has(c.id));

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const searched = filtered.filter(c => c.fullName.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q));
          setCandidates({ ...allCandidates, content: searched, totalElements: searched.length, totalPages: 1 });
        } else {
          setCandidates({ ...allCandidates, content: filtered, totalElements: filtered.length, totalPages: 1 });
        }
        setCurrentPage(0);
      } else {
        // Normal mode
        const pagination: PaginationParams = { page, size: 20, sort: 'createdAt,desc' };
        let result: PageResponse<CandidateDTO>;
        if (searchQuery.trim()) {
          result = await apiService.searchCandidates(searchQuery, pagination);
        } else {
          result = await apiService.getCandidates(pagination, filters);
        }
        setCandidates(result);
        setCurrentPage(page);
      }
    } catch (err) {
      setError('Erro ao carregar candidatos');
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates(0);
  }, [filters, searchQuery, selectedClientId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates(0);
  };

  const handleActivateCandidate = async (id: number) => {
    try {
      await apiService.activateCandidate(id);
      fetchCandidates(currentPage);
    } catch (err) {
      setError('Erro ao ativar candidato');
    }
  };

  const handleBlacklistCandidate = async (id: number) => {
    const reason = prompt('Motivo para blacklist (opcional):');
    try {
      await apiService.blacklistCandidate(id, reason || undefined);
      fetchCandidates(currentPage);
    } catch (err) {
      setError('Erro ao blacklistar candidato');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">Candidatos</h1>
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
              Erro ao carregar candidatos
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchCandidates(currentPage)}>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">Candidatos</h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setInviteModalOpen(true)}>
              Convidar candidato
            </Button>
            <Button variant="primary" onClick={() => navigate('/candidates/new')}>
              Novo Candidato
            </Button>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Buscar candidatos..."
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Headline
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Desenvolvedor Full Stack"
                      value={filters.headline || ''}
                      onChange={(e) => setFilters({ ...filters, headline: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Cidade
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: São Paulo"
                      value={filters.city || ''}
                      onChange={(e) => setFilters({ ...filters, city: e.target.value })}
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
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Results */}
      {candidates && (
        <>
          {(() => {
            const hasSelection = selectedCount > 0;
            const single = selectedCount === 1 ? candidates.content.find(c => c.id === selectedCandidateId) : null;
            return (
              <div className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${hasSelection ? 'bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'}`}>
                <span className={`text-sm font-medium mr-auto ${hasSelection ? 'text-brand-700 dark:text-brand-300' : 'text-gray-400 dark:text-gray-500'}`}>
                  {selectedCount > 1 ? `${selectedCount} candidatos selecionados` : single ? single.fullName : 'Selecione um candidato'}
                </span>
                <Button variant="secondary" size="sm" disabled={!single || single.status === 'ACTIVE'} onClick={() => single && handleActivateCandidate(single.id!)}>
                  Ativar
                </Button>
                <Button variant="danger" size="sm" disabled={!single || single.status === 'BLACKLISTED'} onClick={() => single && handleBlacklistCandidate(single.id!)}>
                  Blacklist
                </Button>
                <Button variant="ghost" size="sm" disabled={!single} onClick={() => single && navigate(`/candidates/${single.id}/edit`)}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" disabled={!hasSelection} onClick={clearSelection}>✕</Button>
              </div>
            );
          })()}
          <Card>
            <CardHeader
              action={
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {candidates.totalElements} candidatos
                </span>
              }
            >
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
                Resultados
              </h2>
            </CardHeader>

            {candidates.content.length === 0 ? (
              <CardBody>
                <EmptyState
                  title="Nenhum candidato encontrado"
                  description="Tente ajustar os filtros ou a busca para encontrar candidatos."
                  actionLabel="Novo Candidato"
                  onAction={() => navigate('/candidates/new')}
                />
              </CardBody>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {candidates.content.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`flex items-center px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-shadow duration-150 hover:shadow-theme-sm${isSelected(candidate) ? ' ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-500/10' : ''}`}
                    onMouseDown={handleRowMouseDown}
                    onClick={(e) => handleRowClick(candidate, e)}
                    onDoubleClick={() => navigate(`/candidates/${candidate.id}/edit`)}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      {/* Avatar */}
                      <div className="mr-4 flex-shrink-0">
                        {candidate.profilePictureUrl ? (
                          <img
                            src={candidate.profilePictureUrl}
                            alt={candidate.fullName}
                            className="w-11 h-11 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-full bg-gradient-to-br ${getGradient(candidate.fullName)} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}
                          >
                            {getInitials(candidate.fullName)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">
                            {candidate.fullName}
                          </h3>
                          {candidate.status && statusVariant[candidate.status] && (
                            <Badge variant={statusVariant[candidate.status] as any}>
                              {statusLabel[candidate.status] ?? candidate.status}
                            </Badge>
                          )}
                          {candidate.origin && originVariant[candidate.origin] && (
                            <Badge variant={originVariant[candidate.origin] as any}>
                              {originLabel[candidate.origin] ?? candidate.origin}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {candidate.email}
                        </p>
                        {(candidate.headline || candidate.city) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {[candidate.headline, candidate.city, candidate.state]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        )}
                        {candidate.experiences && candidate.experiences.length > 0 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {candidate.experiences
                              .filter((exp) => exp.isCurrent)
                              .map((exp) => exp.jobTitle)
                              .join(', ') || 'Sem experiência atual'}
                          </p>
                        )}
                        {candidate.desiredSalary && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Salário desejado: R$ {candidate.desiredSalary.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pagination */}
          {candidates.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={candidates.totalPages}
                totalElements={candidates.totalElements}
                pageSize={20}
                onPageChange={(page) => fetchCandidates(page)}
              />
            </div>
          )}
        </>
      )}

      <InviteCandidateModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
};

export default CandidateList;
