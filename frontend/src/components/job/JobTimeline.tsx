import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { JobHistoryDTO, HistoryType } from '../../types/api';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  EmptyState,
  Skeleton,
} from '../ui';

interface JobTimelineProps {
  jobId: number;
  onAddActivity: () => void;
  refreshKey?: number;
}

type FilterCategory = 'all' | 'candidatos' | 'entrevistas' | 'feedback' | 'notas';

const FILTER_CATEGORIES: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'candidatos', label: 'Candidatos' },
  { key: 'entrevistas', label: 'Entrevistas' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'notas', label: 'Notas' },
];

const CATEGORY_TYPES: Record<FilterCategory, HistoryType[]> = {
  all: [],
  candidatos: [
    HistoryType.SHORTLIST_SENT,
    HistoryType.CANDIDATE_CONTACTED,
    HistoryType.CANDIDATE_APPLIED,
  ],
  entrevistas: [
    HistoryType.INTERVIEW_SCHEDULED,
    HistoryType.INTERVIEW_COMPLETED,
    HistoryType.TECHNICAL_TEST,
    HistoryType.CLIENT_MEETING,
  ],
  feedback: [
    HistoryType.FEEDBACK_RECEIVED,
    HistoryType.OFFER_MADE,
    HistoryType.OFFER_ACCEPTED,
    HistoryType.OFFER_REJECTED,
    HistoryType.CONTRACT_SIGNED,
    HistoryType.CANDIDATE_STARTED,
    HistoryType.REFERENCE_CHECK,
    HistoryType.GUARANTEE_PERIOD,
  ],
  notas: [HistoryType.NOTE, HistoryType.OTHER, HistoryType.STATUS_CHANGED],
};

type ColorScheme = {
  dot: string;
  line: string;
  iconBg: string;
  iconText: string;
  badgeVariant: React.ComponentProps<typeof Badge>['variant'];
};

const TYPE_COLORS: Partial<Record<HistoryType, ColorScheme>> = {
  [HistoryType.SHORTLIST_SENT]: {
    dot: 'bg-blue-500',
    line: 'bg-blue-200 dark:bg-blue-800',
    iconBg: 'bg-blue-50 dark:bg-blue-500/15',
    iconText: 'text-blue-600 dark:text-blue-400',
    badgeVariant: 'info',
  },
  [HistoryType.CANDIDATE_CONTACTED]: {
    dot: 'bg-blue-500',
    line: 'bg-blue-200 dark:bg-blue-800',
    iconBg: 'bg-blue-50 dark:bg-blue-500/15',
    iconText: 'text-blue-600 dark:text-blue-400',
    badgeVariant: 'info',
  },
  [HistoryType.CANDIDATE_APPLIED]: {
    dot: 'bg-blue-500',
    line: 'bg-blue-200 dark:bg-blue-800',
    iconBg: 'bg-blue-50 dark:bg-blue-500/15',
    iconText: 'text-blue-600 dark:text-blue-400',
    badgeVariant: 'info',
  },
  [HistoryType.FEEDBACK_RECEIVED]: {
    dot: 'bg-success-500',
    line: 'bg-success-200 dark:bg-success-800',
    iconBg: 'bg-success-50 dark:bg-success-500/15',
    iconText: 'text-success-600 dark:text-success-400',
    badgeVariant: 'active',
  },
  [HistoryType.OFFER_MADE]: {
    dot: 'bg-success-500',
    line: 'bg-success-200 dark:bg-success-800',
    iconBg: 'bg-success-50 dark:bg-success-500/15',
    iconText: 'text-success-600 dark:text-success-400',
    badgeVariant: 'active',
  },
  [HistoryType.OFFER_ACCEPTED]: {
    dot: 'bg-success-500',
    line: 'bg-success-200 dark:bg-success-800',
    iconBg: 'bg-success-50 dark:bg-success-500/15',
    iconText: 'text-success-600 dark:text-success-400',
    badgeVariant: 'active',
  },
  [HistoryType.CONTRACT_SIGNED]: {
    dot: 'bg-success-500',
    line: 'bg-success-200 dark:bg-success-800',
    iconBg: 'bg-success-50 dark:bg-success-500/15',
    iconText: 'text-success-600 dark:text-success-400',
    badgeVariant: 'active',
  },
  [HistoryType.CANDIDATE_STARTED]: {
    dot: 'bg-success-500',
    line: 'bg-success-200 dark:bg-success-800',
    iconBg: 'bg-success-50 dark:bg-success-500/15',
    iconText: 'text-success-600 dark:text-success-400',
    badgeVariant: 'active',
  },
  [HistoryType.INTERVIEW_SCHEDULED]: {
    dot: 'bg-theme-purple-500',
    line: 'bg-theme-purple-200 dark:bg-theme-purple-800',
    iconBg: 'bg-theme-purple-500/10 dark:bg-theme-purple-500/15',
    iconText: 'text-theme-purple-500',
    badgeVariant: 'featured',
  },
  [HistoryType.INTERVIEW_COMPLETED]: {
    dot: 'bg-theme-purple-500',
    line: 'bg-theme-purple-200 dark:bg-theme-purple-800',
    iconBg: 'bg-theme-purple-500/10 dark:bg-theme-purple-500/15',
    iconText: 'text-theme-purple-500',
    badgeVariant: 'featured',
  },
  [HistoryType.TECHNICAL_TEST]: {
    dot: 'bg-theme-purple-500',
    line: 'bg-theme-purple-200 dark:bg-theme-purple-800',
    iconBg: 'bg-theme-purple-500/10 dark:bg-theme-purple-500/15',
    iconText: 'text-theme-purple-500',
    badgeVariant: 'featured',
  },
  [HistoryType.OFFER_REJECTED]: {
    dot: 'bg-error-500',
    line: 'bg-error-200 dark:bg-error-800',
    iconBg: 'bg-error-50 dark:bg-error-500/15',
    iconText: 'text-error-600 dark:text-error-400',
    badgeVariant: 'blacklisted',
  },
  [HistoryType.CLIENT_MEETING]: {
    dot: 'bg-amber-500',
    line: 'bg-amber-200 dark:bg-amber-800',
    iconBg: 'bg-amber-50 dark:bg-amber-500/15',
    iconText: 'text-amber-600 dark:text-amber-400',
    badgeVariant: 'paused',
  },
  [HistoryType.REFERENCE_CHECK]: {
    dot: 'bg-amber-500',
    line: 'bg-amber-200 dark:bg-amber-800',
    iconBg: 'bg-amber-50 dark:bg-amber-500/15',
    iconText: 'text-amber-600 dark:text-amber-400',
    badgeVariant: 'paused',
  },
  [HistoryType.GUARANTEE_PERIOD]: {
    dot: 'bg-amber-500',
    line: 'bg-amber-200 dark:bg-amber-800',
    iconBg: 'bg-amber-50 dark:bg-amber-500/15',
    iconText: 'text-amber-600 dark:text-amber-400',
    badgeVariant: 'paused',
  },
};

const DEFAULT_COLOR: ColorScheme = {
  dot: 'bg-gray-400',
  line: 'bg-gray-200 dark:bg-gray-700',
  iconBg: 'bg-gray-100 dark:bg-gray-700',
  iconText: 'text-gray-500 dark:text-gray-400',
  badgeVariant: 'inactive',
};

const TYPE_LABELS: Record<HistoryType, string> = {
  [HistoryType.NOTE]: 'Nota',
  [HistoryType.INTERVIEW_SCHEDULED]: 'Entrevista Agendada',
  [HistoryType.INTERVIEW_COMPLETED]: 'Entrevista Realizada',
  [HistoryType.FEEDBACK_RECEIVED]: 'Feedback Recebido',
  [HistoryType.STATUS_CHANGED]: 'Status Alterado',
  [HistoryType.SHORTLIST_SENT]: 'Shortlist Enviada',
  [HistoryType.CANDIDATE_APPLIED]: 'Candidato Inscrito',
  [HistoryType.CANDIDATE_CONTACTED]: 'Candidato Contatado',
  [HistoryType.CLIENT_MEETING]: 'Reunião com Cliente',
  [HistoryType.TECHNICAL_TEST]: 'Teste Técnico',
  [HistoryType.REFERENCE_CHECK]: 'Checagem de Referências',
  [HistoryType.OFFER_MADE]: 'Proposta Enviada',
  [HistoryType.OFFER_ACCEPTED]: 'Proposta Aceita',
  [HistoryType.OFFER_REJECTED]: 'Proposta Recusada',
  [HistoryType.CONTRACT_SIGNED]: 'Contrato Assinado',
  [HistoryType.CANDIDATE_STARTED]: 'Candidato Contratado',
  [HistoryType.GUARANTEE_PERIOD]: 'Período de Garantia',
  [HistoryType.OTHER]: 'Outro',
};

const getTypeIcon = (type: HistoryType): React.ReactNode => {
  switch (type) {
    case HistoryType.INTERVIEW_SCHEDULED:
    case HistoryType.INTERVIEW_COMPLETED:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case HistoryType.SHORTLIST_SENT:
    case HistoryType.CANDIDATE_APPLIED:
    case HistoryType.CANDIDATE_CONTACTED:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case HistoryType.OFFER_MADE:
    case HistoryType.OFFER_ACCEPTED:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case HistoryType.OFFER_REJECTED:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case HistoryType.CONTRACT_SIGNED:
    case HistoryType.CANDIDATE_STARTED:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case HistoryType.CLIENT_MEETING:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case HistoryType.TECHNICAL_TEST:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    case HistoryType.FEEDBACK_RECEIVED:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
  }
};

const plusIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export const JobTimeline: React.FC<JobTimelineProps> = ({ jobId, onAddActivity, refreshKey }) => {
  const [history, setHistory] = useState<JobHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterCategory>('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await apiService.getJobHistory(jobId);
        // Sort newest first
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setHistory(sorted);
      } catch (err) {
        console.error('Error fetching job history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [jobId, refreshKey]);

  const filteredHistory = filter === 'all'
    ? history
    : history.filter((entry) => CATEGORY_TYPES[filter].includes(entry.type));

  const getColors = (type: HistoryType): ColorScheme => TYPE_COLORS[type] ?? DEFAULT_COLOR;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">Historico de Atividades</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="w-0.5 h-12 mt-1" />
                </div>
                <div className="flex-1 pb-4 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        action={
          <Button variant="primary" size="sm" icon={plusIcon} onClick={onAddActivity}>
            Adicionar Atividade
          </Button>
        }
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">Historico de Atividades</h2>
      </CardHeader>
      <CardBody>
        {/* Filter tabs */}
        <div className="flex gap-1 flex-wrap mb-6">
          {FILTER_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 ${
                filter === cat.key
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filteredHistory.length === 0 ? (
          <EmptyState
            title="Nenhuma atividade encontrada"
            description={
              filter === 'all'
                ? 'Ainda nao ha atividades registradas para esta vaga.'
                : 'Nenhuma atividade encontrada para o filtro selecionado.'
            }
            actionLabel={filter === 'all' ? 'Adicionar Primeira Atividade' : undefined}
            onAction={filter === 'all' ? onAddActivity : undefined}
          />
        ) : (
          <div className="relative">
            {filteredHistory.map((entry, index) => {
              const colors = getColors(entry.type);
              const isLast = index === filteredHistory.length - 1;

              return (
                <div key={entry.id} className="flex gap-4">
                  {/* Timeline left column */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${colors.iconBg} ${colors.iconText} z-10`}
                    >
                      {getTypeIcon(entry.type)}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 mt-1 mb-1 min-h-4 ${colors.line}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${!isLast ? 'pb-6' : 'pb-0'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white/90">
                          {entry.title}
                        </span>
                        <Badge variant={colors.badgeVariant}>
                          {TYPE_LABELS[entry.type]}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                        {new Date(entry.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {entry.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1.5 leading-relaxed">
                        {entry.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      {entry.headhunterName && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Por: <span className="font-medium">{entry.headhunterName}</span>
                        </span>
                      )}
                      {entry.candidateName && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Candidato: <span className="font-medium">{entry.candidateName}</span>
                        </span>
                      )}
                      {entry.scheduledDate && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Agendado:{' '}
                          <span className="font-medium">
                            {new Date(entry.scheduledDate).toLocaleDateString('pt-BR')}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
