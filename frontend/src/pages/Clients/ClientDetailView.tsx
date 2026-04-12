import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { ClientDTO, ClientStatus, ClientType } from '../../types/api';
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

  useEffect(() => {
    if (id) {
      loadClient(parseInt(id));
    }
  }, [id]);

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Contact Info */}
          <Card>
            <CardBody>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Informacoes de Contato
              </h2>
              <dl className="space-y-3">
                {client.contactPersonName && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Contato Principal
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">
                      {client.contactPersonName}
                    </dd>
                  </div>
                )}
                {client.contactEmail && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Email
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">
                      <a
                        href={`mailto:${client.contactEmail}`}
                        className="text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {client.contactEmail}
                      </a>
                    </dd>
                  </div>
                )}
                {client.contactPhone && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Telefone
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">
                      {client.contactPhone}
                    </dd>
                  </div>
                )}
                {client.website && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Website
                    </dt>
                    <dd className="text-sm mt-0.5">
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {client.website}
                      </a>
                    </dd>
                  </div>
                )}
                {client.linkedinUrl && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      LinkedIn
                    </dt>
                    <dd className="text-sm mt-0.5">
                      <a
                        href={client.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        {client.linkedinUrl}
                      </a>
                    </dd>
                  </div>
                )}
                {client.cnpj && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      CNPJ
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">
                      {client.cnpj}
                    </dd>
                  </div>
                )}
                {client.companySize && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Porte
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">
                      {client.companySize}
                    </dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          {/* Address */}
          <Card>
            <CardBody>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Endereco
              </h2>
              {client.address || client.city || client.state ? (
                <dl className="space-y-3">
                  {client.address && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Logradouro
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">
                        {client.address}
                      </dd>
                    </div>
                  )}
                  {(client.city || client.state) && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Cidade / Estado
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">
                        {[client.city, client.state].filter(Boolean).join(', ')}
                      </dd>
                    </div>
                  )}
                  {client.zipCode && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        CEP
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">
                        {client.zipCode}
                      </dd>
                    </div>
                  )}
                  {client.country && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Pais
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white/90 mt-0.5">
                        {client.country}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Endereco nao informado.
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Description */}
        {(client.description || client.notes) && (
          <Card className="mb-6">
            <CardBody>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Descricao
              </h2>
              {client.description && (
                <div className="mb-4">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Sobre a Empresa
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {client.description}
                  </p>
                </div>
              )}
              {client.notes && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Notas Internas
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Vagas desta Empresa - Placeholder */}
        <Card>
          <CardBody>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Vagas desta Empresa
            </h2>
            <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
              <svg
                className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Vagas associadas a esta empresa serao exibidas aqui.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Funcionalidade em desenvolvimento.
              </p>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/jobs')}
                >
                  Ver todas as vagas
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ClientDetailView;
