import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { ClientDTO, ClientStatus, ClientType, JobDTO, JobHistoryDTO } from '../../types/api';
import { Badge, Button, Card, CardBody } from '../../components/ui';

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

const ClientDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<ClientDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [clientJobs, setClientJobs] = useState<JobDTO[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobHistories, setJobHistories] = useState<(JobHistoryDTO & { jobTitle?: string })[]>([]);
  const [historiesLoading, setHistoriesLoading] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'vagas' | 'historico' | 'notas'>('info');

  useEffect(() => {
    if (id) {
      const clientId = parseInt(id);
      loadClient(clientId);
      loadClientJobs(clientId);
    }
  }, [id]);

  const loadClientJobs = async (clientId: number) => {
    try {
      setJobsLoading(true);
      const result = await apiService.getJobs({ page: 0, size: 100 }, { clientId });
      const jobs = result.content || [];
      setClientJobs(jobs);
      loadJobHistories(jobs);
    } catch (err) {
      console.error('Error loading client jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  const loadJobHistories = async (jobs: JobDTO[]) => {
    if (jobs.length === 0) return;
    try {
      setHistoriesLoading(true);
      const allHistories: (JobHistoryDTO & { jobTitle?: string })[] = [];
      const promises = jobs.slice(0, 50).map(async (job) => {
        if (!job.id) return;
        const histories = await apiService.getJobHistory(job.id);
        histories.forEach((h: JobHistoryDTO) => allHistories.push({ ...h, jobTitle: job.title }));
      });
      await Promise.all(promises);
      allHistories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setJobHistories(allHistories);
    } catch (err) {
      console.error('Error loading job histories:', err);
    } finally {
      setHistoriesLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!client?.id) return;
    try {
      setSavingNotes(true);
      await apiService.updateClient(client.id, { ...client, notes: notesText });
      setClient({ ...client, notes: notesText });
      setEditingNotes(false);
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const loadClient = async (clientId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getClientById(clientId);
      setClient(data);
    } catch (err) {
      setError('Erro ao carregar empresa');
      console.error('Error loading client:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!client?.id) return;
    try {
      setActionLoading(true);
      await apiService.activateClient(client.id);
      await loadClient(client.id);
    } catch (err) {
      setError('Erro ao ativar empresa');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!client?.id) return;
    try {
      setActionLoading(true);
      await apiService.suspendClient(client.id);
      await loadClient(client.id);
    } catch (err) {
      setError('Erro ao suspender empresa');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
                Empresa nao encontrada
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {error || 'Nao foi possivel carregar os dados desta empresa.'}
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/clients')}>
                Voltar para Empresas
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Empresas
          </button>
        </div>

        {/* Header Card */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Logo / Avatar */}
                {client.logoUrl ? (
                  <img
                    src={client.logoUrl}
                    alt={client.companyName}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getGradient(client.companyName)} flex items-center justify-center text-white text-xl font-bold shadow-md`}
                  >
                    {getInitials(client.companyName)}
                  </div>
                )}

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {client.companyName}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {client.industry && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {client.industry}
                      </span>
                    )}
                    {client.status && (
                      <Badge variant={clientStatusVariant[client.status] as any}>
                        {clientStatusLabel[client.status]}
                      </Badge>
                    )}
                    {client.type && (
                      <Badge variant="info">
                        {clientTypeLabel[client.type]}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {client.status !== ClientStatus.ACTIVE && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleActivate}
                    disabled={actionLoading}
                    loading={actionLoading}
                  >
                    Ativar
                  </Button>
                )}
                {client.status !== ClientStatus.SUSPENDED && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleSuspend}
                    disabled={actionLoading}
                    loading={actionLoading}
                  >
                    Suspender
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/clients/${client.id}/edit`)}
                >
                  Editar
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex gap-6 -mb-px">
            {([
              { key: 'info', label: 'Informacoes' },
              { key: 'vagas', label: `Vagas (${clientJobs.length})` },
              { key: 'historico', label: `Historico (${jobHistories.length})` },
              { key: 'notas', label: 'Notas' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab: Informacoes */}
        {activeTab === 'info' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardBody>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Contato</h2>
                  <dl className="space-y-3">
                    {client.contactPersonName && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contato Principal</dt>
                        <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">{client.contactPersonName}</dd>
                      </div>
                    )}
                    {client.contactEmail && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</dt>
                        <dd className="text-sm mt-0.5"><a href={`mailto:${client.contactEmail}`} className="text-brand-600 dark:text-brand-400 hover:underline">{client.contactEmail}</a></dd>
                      </div>
                    )}
                    {client.contactPhone && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Telefone</dt>
                        <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">{client.contactPhone}</dd>
                      </div>
                    )}
                    {client.website && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Website</dt>
                        <dd className="text-sm mt-0.5"><a href={client.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">{client.website}</a></dd>
                      </div>
                    )}
                    {client.linkedinUrl && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">LinkedIn</dt>
                        <dd className="text-sm mt-0.5"><a href={client.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">{client.linkedinUrl}</a></dd>
                      </div>
                    )}
                    {client.cnpj && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">CNPJ</dt>
                        <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">{client.cnpj}</dd>
                      </div>
                    )}
                    {client.companySize && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Porte</dt>
                        <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">{client.companySize}</dd>
                      </div>
                    )}
                  </dl>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Endereco</h2>
                  {client.address || client.city || client.state ? (
                    <dl className="space-y-3">
                      {client.address && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Logradouro</dt>
                          <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">{client.address}</dd>
                        </div>
                      )}
                      {(client.city || client.state) && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cidade / Estado</dt>
                          <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">{[client.city, client.state].filter(Boolean).join(', ')}</dd>
                        </div>
                      )}
                      {client.zipCode && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">CEP</dt>
                          <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">{client.zipCode}</dd>
                        </div>
                      )}
                      {client.country && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pais</dt>
                          <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">{client.country}</dd>
                        </div>
                      )}
                    </dl>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">Endereco nao informado.</p>
                  )}
                </CardBody>
              </Card>
            </div>
            {client.description && (
              <Card>
                <CardBody>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Sobre a Empresa</h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{client.description}</p>
                </CardBody>
              </Card>
            )}
          </>
        )}

        {/* Tab: Vagas */}
        {activeTab === 'vagas' && (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Vagas desta Empresa ({clientJobs.length})
                </h2>
                <Button variant="outline" size="sm" onClick={() => navigate('/jobs')}>Ver todas</Button>
              </div>
              {jobsLoading ? (
                <div className="text-center py-4 text-sm text-gray-500">Carregando vagas...</div>
              ) : clientJobs.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma vaga associada a esta empresa.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{job.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{job.location || 'Sem localidade'}</p>
                      </div>
                      <Badge variant={
                        job.status === 'ACTIVE' ? 'active' :
                        job.status === 'CLOSED' ? 'inactive' :
                        job.status === 'PAUSED' ? 'info' : 'default'
                      }>
                        {job.status === 'ACTIVE' ? 'Aberta' :
                         job.status === 'CLOSED' ? 'Fechada' :
                         job.status === 'PAUSED' ? 'Pausada' :
                         job.status === 'DRAFT' ? 'Rascunho' : job.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Tab: Historico */}
        {activeTab === 'historico' && (
          <Card>
            <CardBody>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Historico das Vagas ({jobHistories.length})
              </h2>
              {historiesLoading ? (
                <div className="text-center py-4 text-sm text-gray-500">Carregando historico...</div>
              ) : jobHistories.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum historico disponivel.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobHistories.slice(0, 100).map((h, idx) => (
                    <div
                      key={h.id || idx}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
                    >
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                        h.type === 'STATUS_CHANGED' ? 'bg-blue-500' :
                        h.type === 'SHORTLIST_SENT' ? 'bg-purple-500' :
                        h.type === 'INTERVIEW_SCHEDULED' ? 'bg-yellow-500' :
                        h.type === 'OFFER_MADE' ? 'bg-green-500' :
                        h.type === 'CANDIDATE_CONTACTED' ? 'bg-teal-500' :
                        'bg-gray-400'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{h.title}</p>
                          <Badge variant="inactive">{h.jobTitle || `Vaga #${h.jobId}`}</Badge>
                        </div>
                        {h.description && h.description !== h.title && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{h.description}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(h.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Tab: Notas */}
        {activeTab === 'notas' && (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notas Internas</h2>
                {!editingNotes && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setNotesText(client.notes || ''); setEditingNotes(true); }}
                  >
                    {client.notes ? 'Editar' : 'Adicionar nota'}
                  </Button>
                )}
              </div>
              {editingNotes ? (
                <div>
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white p-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    placeholder="Escreva notas internas sobre esta empresa..."
                  />
                  <div className="flex gap-2 mt-3 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEditingNotes(false)} disabled={savingNotes}>Cancelar</Button>
                    <Button variant="primary" size="sm" onClick={handleSaveNotes} loading={savingNotes} disabled={savingNotes}>Salvar</Button>
                  </div>
                </div>
              ) : client.notes ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{client.notes}</p>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma nota adicionada.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => { setNotesText(''); setEditingNotes(true); }}>
                    Adicionar primeira nota
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClientDetailView;
