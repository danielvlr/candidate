import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientDTO, ClientStatus, ClientType } from '../../types/api';
import { Badge, Button, Card, CardHeader, CardBody, EmptyState, Pagination, SkeletonCard } from '../../components/ui';
import { useListSelection } from '../../hooks/useListSelection';
import { useToast } from '../../components/ui';
import { useHeadhunterFilter } from '../../context/HeadhunterFilterContext';
import apiService from '../../services/api';

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

const clientStatusLabel: Record<ClientStatus, string> = {
  [ClientStatus.ACTIVE]: 'Ativa',
  [ClientStatus.INACTIVE]: 'Inativa',
  [ClientStatus.SUSPENDED]: 'Suspensa',
  [ClientStatus.PROSPECT]: 'Prospect',
};

const clientStatusVariant: Record<ClientStatus, string> = {
  [ClientStatus.ACTIVE]: 'active',
  [ClientStatus.INACTIVE]: 'inactive',
  [ClientStatus.SUSPENDED]: 'blacklisted',
  [ClientStatus.PROSPECT]: 'info',
};

const clientTypeLabel: Record<ClientType, string> = {
  [ClientType.STARTUP]: 'Startup',
  [ClientType.SME]: 'PME',
  [ClientType.ENTERPRISE]: 'Enterprise',
  [ClientType.MULTINATIONAL]: 'Multinacional',
  [ClientType.GOVERNMENT]: 'Governo',
  [ClientType.NGO]: 'ONG',
  [ClientType.CONSULTING]: 'Consultoria',
};

const ClientList: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { selectedHeadhunterId } = useHeadhunterFilter();
  const { selectedId: selectedClientIdRow, selectedCount, handleRowClick, handleRowMouseDown, clearSelection, isSelected } = useListSelection<ClientDTO>();
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<{ companyName?: string; city?: string; industry?: string; status?: ClientStatus; type?: ClientType }>({});
  const pageSize = 20;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const allClients = await apiService.getActiveClients();
        if (selectedHeadhunterId) {
          const jobs = await apiService.getJobs({ page: 0, size: 500 });
          const hhJobs = (jobs.content || []).filter((j: any) => j.headhunterId === selectedHeadhunterId);
          const clientIds = new Set(hhJobs.map((j: any) => j.clientId).filter(Boolean));
          setClients(allClients.filter(c => c.id && clientIds.has(c.id)));
        } else {
          setClients(allClients);
        }
      } catch (err) {
        console.error('Error loading clients:', err);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedHeadhunterId]);

  const filteredClients = useMemo(() => {
    let result = clients;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.companyName.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.contactPersonName?.toLowerCase().includes(q) ||
        c.contactEmail?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      );
    }
    if (filters.companyName) {
      const f = filters.companyName.toLowerCase();
      result = result.filter(c => c.companyName.toLowerCase().includes(f));
    }
    if (filters.city) {
      const f = filters.city.toLowerCase();
      result = result.filter(c => c.city?.toLowerCase().includes(f));
    }
    if (filters.industry) {
      const f = filters.industry.toLowerCase();
      result = result.filter(c => c.industry?.toLowerCase().includes(f));
    }
    if (filters.status) {
      result = result.filter(c => c.status === filters.status);
    }
    if (filters.type) {
      result = result.filter(c => c.type === filters.type);
    }
    return result;
  }, [clients, searchQuery, filters]);

  const totalPages = Math.ceil(filteredClients.length / pageSize);
  const paginatedClients = filteredClients.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const activeFilterCount = [filters.companyName, filters.city, filters.industry, filters.status, filters.type].filter(Boolean).length;

  const handleActivateClient = (id: number) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, status: ClientStatus.ACTIVE } : c));
    addToast({ type: 'success', title: 'Empresa ativada', message: 'Status alterado para Ativa.' });
  };

  const handleSuspendClient = (id: number) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, status: ClientStatus.SUSPENDED } : c));
    addToast({ type: 'warning', title: 'Empresa suspensa', message: 'Status alterado para Suspensa.' });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">Empresas</h1>
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
      <div className="mb-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90">Empresas</h1>
          <Button variant="primary" onClick={() => navigate('/clients/new')}>
            Nova Empresa
          </Button>
        </div>

        {/* Search */}
        <form onSubmit={(e) => { e.preventDefault(); setCurrentPage(0); }} className="mb-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Buscar empresas..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500"
            />
            <Button type="submit" variant="secondary">Buscar</Button>
          </div>
        </form>

        {/* Collapsible Filters */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white/90 transition-colors"
          >
            <svg className={`h-4 w-4 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome da Empresa</label>
                    <input type="text" placeholder="Ex: Tech Solutions" value={filters.companyName || ''} onChange={(e) => setFilters({ ...filters, companyName: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cidade</label>
                    <input type="text" placeholder="Ex: São Paulo" value={filters.city || ''} onChange={(e) => setFilters({ ...filters, city: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Setor</label>
                    <input type="text" placeholder="Ex: Tecnologia" value={filters.industry || ''} onChange={(e) => setFilters({ ...filters, industry: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                    <select value={filters.status || ''} onChange={(e) => setFilters({ ...filters, status: (e.target.value as ClientStatus) || undefined })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90">
                      <option value="">Todos</option>
                      {Object.values(ClientStatus).map((s) => (<option key={s} value={s}>{clientStatusLabel[s]}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo</label>
                    <select value={filters.type || ''} onChange={(e) => setFilters({ ...filters, type: (e.target.value as ClientType) || undefined })} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90">
                      <option value="">Todos</option>
                      {Object.values(ClientType).map((t) => (<option key={t} value={t}>{clientTypeLabel[t]}</option>))}
                    </select>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Action Bar */}
      {(() => {
        const hasSelection = selectedCount > 0;
        const single = selectedCount === 1 ? filteredClients.find(c => c.id === selectedClientIdRow) : null;
        return (
          <div className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${hasSelection ? 'bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'}`}>
            <span className={`text-sm font-medium mr-auto ${hasSelection ? 'text-brand-700 dark:text-brand-300' : 'text-gray-400 dark:text-gray-500'}`}>
              {selectedCount > 1 ? `${selectedCount} empresas selecionadas` : single ? single.companyName : 'Selecione uma empresa'}
            </span>
            <Button variant="secondary" size="sm" disabled={!single || single.status === ClientStatus.ACTIVE} onClick={() => single && handleActivateClient(single.id!)}>Ativar</Button>
            <Button variant="danger" size="sm" disabled={!single || single.status === ClientStatus.SUSPENDED} onClick={() => single && handleSuspendClient(single.id!)}>Suspender</Button>
            <Button variant="secondary" size="sm" disabled={!single} onClick={() => single && navigate(`/clients/${single.id}`)}>Ver Detalhes</Button>
            <Button variant="ghost" size="sm" disabled={!single} onClick={() => single && navigate(`/clients/${single.id}/edit`)}>Editar</Button>
            <Button variant="ghost" size="sm" disabled={!hasSelection} onClick={clearSelection}>✕</Button>
          </div>
        );
      })()}

      {/* Results */}
      <Card>
        <CardHeader action={<span className="text-sm text-gray-500 dark:text-gray-400">{filteredClients.length} empresas</span>}>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">Resultados</h2>
        </CardHeader>

        {filteredClients.length === 0 ? (
          <CardBody>
            <EmptyState
              title="Nenhuma empresa encontrada"
              description="Tente ajustar os filtros ou a busca para encontrar empresas."
              actionLabel="Nova Empresa"
              onAction={() => navigate('/clients/new')}
            />
          </CardBody>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedClients.map((client) => (
              <div
                key={client.id}
                className={`flex items-center px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-shadow duration-150 hover:shadow-theme-sm${isSelected(client) ? ' ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-500/10' : ''}`}
                onMouseDown={handleRowMouseDown}
                onClick={(e) => handleRowClick(client, e)}
                onDoubleClick={() => navigate(`/clients/${client.id}`)}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="mr-4 flex-shrink-0">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getGradient(client.companyName)} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}>
                      {getInitials(client.companyName)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">{client.companyName}</h3>
                      {client.status && (<Badge variant={clientStatusVariant[client.status] as any}>{clientStatusLabel[client.status]}</Badge>)}
                      {client.type && (<Badge variant="info">{clientTypeLabel[client.type]}</Badge>)}
                    </div>
                    {client.industry && (<p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{client.industry}</p>)}
                    {(client.city || client.state) && (<p className="text-xs text-gray-500 dark:text-gray-400 truncate">{[client.city, client.state].filter(Boolean).join(', ')}</p>)}
                    {client.contactPersonName && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        Contato: {client.contactPersonName}
                        {client.contactEmail && ` • ${client.contactEmail}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={filteredClients.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
};

export default ClientList;
