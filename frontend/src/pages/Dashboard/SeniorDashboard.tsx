import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AssessoradoDTO,
  AssessoradoPhase,
  AssessoradoStatus,
} from '../../types/api';
import { apiService } from '../../services/api';
import {
  Badge,
  Card,
  CardHeader,
  CardBody,
  EmptyState,
  SkeletonCard,
  SkeletonStatCard,
} from '../../components/ui';

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

const PHASE_LABELS: Record<AssessoradoPhase, string> = {
  [AssessoradoPhase.ONBOARDING]: 'Onboarding',
  [AssessoradoPhase.ACTIVE_SEARCH]: 'Busca Ativa',
  [AssessoradoPhase.INTERVIEW_PREP]: 'Prep. Entrevista',
  [AssessoradoPhase.NEGOTIATION]: 'Negociação',
  [AssessoradoPhase.PLACED]: 'Colocado',
  [AssessoradoPhase.COMPLETED]: 'Concluído',
};

const PHASE_BADGE: Record<AssessoradoPhase, 'info' | 'active' | 'featured' | 'urgent' | 'inactive'> = {
  [AssessoradoPhase.ONBOARDING]: 'info',
  [AssessoradoPhase.ACTIVE_SEARCH]: 'active',
  [AssessoradoPhase.INTERVIEW_PREP]: 'featured',
  [AssessoradoPhase.NEGOTIATION]: 'urgent',
  [AssessoradoPhase.PLACED]: 'active',
  [AssessoradoPhase.COMPLETED]: 'inactive',
};

const STATUS_LABELS: Record<AssessoradoStatus, string> = {
  [AssessoradoStatus.ACTIVE]: 'Ativo',
  [AssessoradoStatus.PAUSED]: 'Pausado',
  [AssessoradoStatus.COMPLETED]: 'Concluído',
  [AssessoradoStatus.CANCELLED]: 'Cancelado',
};

const STATUS_BADGE: Record<AssessoradoStatus, 'active' | 'paused' | 'hired' | 'inactive'> = {
  [AssessoradoStatus.ACTIVE]: 'active',
  [AssessoradoStatus.PAUSED]: 'paused',
  [AssessoradoStatus.COMPLETED]: 'hired',
  [AssessoradoStatus.CANCELLED]: 'inactive',
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR');

const SeniorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [assessorados, setAssessorados] = useState<AssessoradoDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getAssessorados()
      .then(res => setAssessorados(res.content || []))
      .catch(err => console.error('Error loading assessorados:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalCount = assessorados.length;
  const activeCount = assessorados.filter(
    (a) => a.status === AssessoradoStatus.ACTIVE
  ).length;
  const activeSearchCount = assessorados.filter(
    (a) => a.currentPhase === AssessoradoPhase.ACTIVE_SEARCH
  ).length;
  const placedCount = assessorados.filter(
    (a) => a.currentPhase === AssessoradoPhase.PLACED
  ).length;

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
          Dashboard do Senior
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Acompanhe seus assessorados e vagas sugeridas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
                <svg className="h-6 w-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Total Assessorados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white/90">
                  {totalCount}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Ativos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white/90">
                  {activeCount}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Em Busca Ativa
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white/90">
                  {activeSearchCount}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Colocados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white/90">
                  {placedCount}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Assessorados list */}
      <div className="mb-8">
        <Card>
          <CardHeader
            action={
              <button
                onClick={() => navigate('/assessorados')}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                Ver todos
              </button>
            }
          >
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
              Meus Assessorados
            </h2>
          </CardHeader>

          {assessorados.length === 0 ? (
            <CardBody>
              <EmptyState
                title="Nenhum assessorado encontrado"
                description="Você ainda não possui assessorados vinculados."
                actionLabel="Novo Assessorado"
                onAction={() => navigate('/assessorados/new')}
              />
            </CardBody>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {assessorados.map((assessorado) => {
                const name = assessorado.candidate?.fullName ?? 'Candidato';
                return (
                  <div
                    key={assessorado.id}
                    className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    onClick={() => navigate(`/assessorados/${assessorado.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${getGradient(name)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
                      >
                        {getInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">
                            {name}
                          </span>
                          <Badge variant={PHASE_BADGE[assessorado.currentPhase]}>
                            {PHASE_LABELS[assessorado.currentPhase]}
                          </Badge>
                          <Badge variant={STATUS_BADGE[assessorado.status]}>
                            {STATUS_LABELS[assessorado.status]}
                          </Badge>
                        </div>
                        {assessorado.specializations && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {assessorado.specializations}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          Início: {formatDate(assessorado.advisoryStartDate)}
                        </p>
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
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Vagas Sugeridas */}
      <Card>
        <CardHeader
          action={
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Ver todas as vagas
            </button>
          }
        >
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white/90">
            Vagas Compatíveis com Assessorados
          </h2>
        </CardHeader>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[
            { id: 1, title: 'Tech Lead Full Stack', company: 'TechCorp Brasil', location: 'São Paulo, SP', salary: 'R$ 25.000 - R$ 35.000', match: 'Carlos Eduardo Mendes', matchPhase: 'Busca Ativa' },
            { id: 2, title: 'Head de Produto Digital', company: 'Fintech Solutions', location: 'Remoto', salary: 'R$ 30.000 - R$ 40.000', match: 'Fernanda Oliveira Santos', matchPhase: 'Prep. Entrevista' },
            { id: 3, title: 'Staff Data Engineer', company: 'DataBank S.A.', location: 'Campinas, SP', salary: 'R$ 28.000 - R$ 38.000', match: 'Lucas Pereira da Silva', matchPhase: 'Negociação' },
            { id: 4, title: 'Senior React Native Developer', company: 'AppMakers Inc.', location: 'Porto Alegre, RS', salary: 'R$ 18.000 - R$ 25.000', match: 'Pedro Henrique Rocha', matchPhase: 'Busca Ativa' },
            { id: 5, title: 'SRE Lead Engineer', company: 'CloudScale Global', location: 'Remoto', salary: 'USD 8.000 - USD 12.000', match: 'Ricardo Gomes Ferreira', matchPhase: 'Onboarding' },
          ].map((job) => (
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
                  <Badge variant="info">{job.matchPhase}</Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {job.company} &bull; {job.location}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {job.salary}
                </p>
                <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">
                  Match: {job.match}
                </p>
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
      </Card>
    </div>
  );
};

export default SeniorDashboard;
