import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { HeadhunterDTO, JobDTO } from '../../types/api';
import { Badge, Button, Card, CardBody } from '../../components/ui';
import { JobHistoryPreview } from './JobHistoryPreview';

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

const seniorityLabel: Record<string, string> = {
  JUNIOR: 'Junior',
  PLENO: 'Pleno',
  SENIOR: 'Senior',
  ESPECIALISTA: 'Especialista',
};

const statusLabel: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  SUSPENDED: 'Suspenso',
};

const statusVariant: Record<string, string> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'blacklisted',
};

const HeadhunterDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [headhunter, setHeadhunter] = useState<HeadhunterDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobDTO[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadHeadhunter(parseInt(id));
    }
  }, [id]);

  const loadHeadhunter = async (hhId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getHeadhunterById(hhId);
      setHeadhunter(data);
      loadJobs(hhId);
    } catch (err) {
      setError('Erro ao carregar headhunter');
      console.error('Error loading headhunter:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async (hhId: number) => {
    try {
      setJobsLoading(true);
      const result = await apiService.getJobs({ page: 0, size: 100 }, {});
      const hhJobs = result.content?.filter((j: JobDTO) => j.headhunterId === hhId) || [];
      setJobs(hhJobs);
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando headhunter...</p>
        </div>
      </div>
    );
  }

  if (error || !headhunter) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error || 'Headhunter nao encontrado'}</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/headhunters')}>
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  const formatCurrency = (value?: number) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercent = (value?: number) => {
    if (value == null) return '-';
    return `${value}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/headhunters')}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            {headhunter.profilePictureUrl ? (
              <img
                src={headhunter.profilePictureUrl}
                alt={headhunter.fullName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradient(headhunter.fullName)} flex items-center justify-center text-white font-semibold text-sm`}>
                {getInitials(headhunter.fullName)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{headhunter.fullName}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{headhunter.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[headhunter.status || 'ACTIVE'] as any}>
            {statusLabel[headhunter.status || 'ACTIVE']}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Informacoes
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Telefone</h3>
                  <p className="text-sm text-gray-900 dark:text-white">{headhunter.phone || '-'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Senioridade</h3>
                  <p className="text-sm text-gray-900 dark:text-white">{seniorityLabel[headhunter.seniority || ''] || headhunter.seniority || '-'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Custo Fixo</h3>
                  <p className="text-sm text-gray-900 dark:text-white">{formatCurrency(headhunter.fixedCost)}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Custo Variavel</h3>
                  <p className="text-sm text-gray-900 dark:text-white">{formatPercent(headhunter.variableCost)}</p>
                </div>
                {headhunter.linkedinUrl && (
                  <div className="sm:col-span-2">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">LinkedIn</h3>
                    <a href={headhunter.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:text-brand-700">
                      {headhunter.linkedinUrl}
                    </a>
                  </div>
                )}
                {headhunter.responsibleAreas && (
                  <div className="sm:col-span-2">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Areas de Atuacao</h3>
                    <p className="text-sm text-gray-900 dark:text-white">{headhunter.responsibleAreas}</p>
                  </div>
                )}
                {headhunter.biography && (
                  <div className="sm:col-span-2">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Biografia</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{headhunter.biography}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Vagas do Headhunter */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Vagas ({jobs.length})
                </h2>
              </div>
              {jobsLoading ? (
                <div className="text-center py-4 text-sm text-gray-500">Carregando vagas...</div>
              ) : jobs.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma vaga atribuida a este headhunter.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {job.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {job.companyName || 'Sem empresa'}
                          </p>
                        </div>
                        <Badge variant={
                          job.status === 'ACTIVE' ? 'active' :
                          job.status === 'CLOSED' ? 'inactive' :
                          job.status === 'PAUSED' ? 'info' : 'inactive'
                        }>
                          {job.status === 'ACTIVE' ? 'Aberta' :
                           job.status === 'CLOSED' ? 'Fechada' :
                           job.status === 'PAUSED' ? 'Pausada' :
                           job.status === 'DRAFT' ? 'Rascunho' : job.status}
                        </Badge>
                      </div>
                      {job.id !== undefined && <JobHistoryPreview jobId={job.id} />}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardBody>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Resumo</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Vagas</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{jobs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Vagas Abertas</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {jobs.filter(j => j.status === 'ACTIVE').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Vagas Fechadas</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {jobs.filter(j => j.status === 'CLOSED').length}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {headhunter.createdAt && (
            <Card>
              <CardBody>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Datas</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Criado em</h3>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(headhunter.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {headhunter.updatedAt && (
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Atualizado em</h3>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(headhunter.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeadhunterDetailView;
