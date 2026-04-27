import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui';
import { TimelineEntryDTO, HistoryType } from '../../types/api';

const TYPE_LABELS: Record<HistoryType, string> = {
  [HistoryType.NOTE]: 'Nota',
  [HistoryType.INTERVIEW_SCHEDULED]: 'Entrevista Agendada',
  [HistoryType.INTERVIEW_COMPLETED]: 'Entrevista Realizada',
  [HistoryType.FEEDBACK_RECEIVED]: 'Feedback Recebido',
  [HistoryType.STATUS_CHANGED]: 'Status Alterado',
  [HistoryType.SHORTLIST_SENT]: 'Shortlist Enviada',
  [HistoryType.CANDIDATE_APPLIED]: 'Candidato Inscrito',
  [HistoryType.CANDIDATE_CONTACTED]: 'Candidato Contatado',
  [HistoryType.CLIENT_MEETING]: 'Reuniao com Cliente',
  [HistoryType.TECHNICAL_TEST]: 'Teste Tecnico',
  [HistoryType.REFERENCE_CHECK]: 'Checagem de Referencias',
  [HistoryType.OFFER_MADE]: 'Proposta Enviada',
  [HistoryType.OFFER_ACCEPTED]: 'Proposta Aceita',
  [HistoryType.OFFER_REJECTED]: 'Proposta Recusada',
  [HistoryType.CONTRACT_SIGNED]: 'Contrato Assinado',
  [HistoryType.CANDIDATE_STARTED]: 'Candidato Contratado',
  [HistoryType.GUARANTEE_PERIOD]: 'Periodo de Garantia',
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

interface TimelineProps {
  entries: TimelineEntryDTO[];
  loading?: boolean;
  emptyMessage?: string;
  onEdit?: (entry: TimelineEntryDTO) => void;
  onDelete?: (entry: TimelineEntryDTO) => void;
}

const TimelineEntrySkeleton: React.FC = () => (
  <div className="flex gap-4 animate-pulse">
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="w-0.5 flex-1 mt-1 mb-1 min-h-8 bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="flex-1 pb-6 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    </div>
  </div>
);

export const Timeline: React.FC<TimelineProps> = ({
  entries,
  loading = false,
  emptyMessage = 'Nenhuma atividade registrada.',
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-0">
        {[1, 2, 3].map((i) => (
          <TimelineEntrySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {entries.map((entry, index) => {
        const isEmpresa = entry.origin === 'EMPRESA';
        const isLast = index === entries.length - 1;

        const iconBg = isEmpresa
          ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
          : 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400';
        const lineBg = isEmpresa
          ? 'bg-indigo-200 dark:bg-indigo-800'
          : 'bg-blue-200 dark:bg-blue-800';
        const containerBorder = isEmpresa ? 'border-l-indigo-500' : 'border-l-blue-500';
        const containerBg = isEmpresa
          ? 'bg-indigo-50/30 dark:bg-indigo-500/5'
          : 'bg-blue-50/30 dark:bg-blue-500/5';

        return (
          <div key={`${entry.origin}-${entry.id}`} className="flex gap-4">
            {/* Timeline left column */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${iconBg} z-10`}>
                {getTypeIcon(entry.type)}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 mt-1 mb-1 min-h-4 ${lineBg}`} />
              )}
            </div>

            {/* Content card */}
            <div className={`flex-1 ${!isLast ? 'pb-6' : 'pb-0'}`}>
              <div
                className={`rounded-lg border-l-4 ${containerBorder} ${containerBg} border border-gray-100 dark:border-gray-700/50 px-4 py-3`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {entry.title && (
                      <span className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">
                        {entry.title}
                      </span>
                    )}
                    {/* Type badge */}
                    <Badge variant="inactive">
                      {TYPE_LABELS[entry.type] ?? entry.type}
                    </Badge>
                    {/* Origin badge */}
                    {isEmpresa ? (
                      <Badge variant="paused">Empresa</Badge>
                    ) : (
                      <button
                        type="button"
                        onClick={() => entry.jobId && navigate(`/jobs/${entry.jobId}`)}
                        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
                        aria-label={`Ver vaga ${entry.jobTitle ?? entry.jobId}`}
                      >
                        <Badge variant="featured">
                          {entry.jobTitle ?? `Vaga #${entry.jobId}`}
                        </Badge>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(entry)}
                        className="ml-1 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label="Editar"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(entry)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Excluir"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                {entry.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                    {entry.description}
                  </p>
                )}

                {/* Meta row */}
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
          </div>
        );
      })}
    </div>
  );
};
