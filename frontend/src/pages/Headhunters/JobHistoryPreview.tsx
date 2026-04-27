import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { HistoryType, JobHistoryDTO } from '../../types/api';
import { formatRelative } from '../Dashboard/activityFeed';

interface JobHistoryPreviewProps {
  jobId: number;
}

const PREVIEW_COUNT = 3;

const ICON_BY_TYPE: Partial<Record<HistoryType, string>> = {
  [HistoryType.OFFER_MADE]: '🤝',
  [HistoryType.OFFER_ACCEPTED]: '✅',
  [HistoryType.OFFER_REJECTED]: '❌',
  [HistoryType.CONTRACT_SIGNED]: '📝',
  [HistoryType.CANDIDATE_STARTED]: '🎉',
  [HistoryType.INTERVIEW_SCHEDULED]: '📅',
  [HistoryType.INTERVIEW_COMPLETED]: '📅',
  [HistoryType.SHORTLIST_SENT]: '📋',
  [HistoryType.TECHNICAL_TEST]: '🧪',
  [HistoryType.FEEDBACK_RECEIVED]: '💬',
  [HistoryType.STATUS_CHANGED]: '🔄',
  [HistoryType.CANDIDATE_APPLIED]: '👤',
  [HistoryType.CANDIDATE_CONTACTED]: '👤',
  [HistoryType.CLIENT_MEETING]: '🏢',
  [HistoryType.REFERENCE_CHECK]: '🔍',
  [HistoryType.GUARANTEE_PERIOD]: '🛡️',
  [HistoryType.NOTE]: '🗒️',
};

const stop = (e: React.MouseEvent) => e.stopPropagation();

export const JobHistoryPreview: React.FC<JobHistoryPreviewProps> = ({ jobId }) => {
  const [entries, setEntries] = useState<JobHistoryDTO[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiService
      .getJobHistory(jobId)
      .then((data) => {
        if (cancelled) return;
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setEntries(sorted);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (loading) {
    return (
      <div className="mt-2 space-y-1">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
            style={{ width: `${70 - i * 15}%` }}
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="mt-2 text-xs italic text-gray-400 dark:text-gray-500">
        Sem histórico registrado.
      </p>
    );
  }

  const visible = expanded ? entries : entries.slice(0, PREVIEW_COUNT);
  const remaining = entries.length - PREVIEW_COUNT;

  return (
    <div className="mt-2 space-y-1">
      {visible.map((entry) => (
        <div key={entry.id} className="flex items-start gap-1.5 text-xs">
          <span className="leading-4 flex-shrink-0" aria-hidden>
            {ICON_BY_TYPE[entry.type] ?? '•'}
          </span>
          <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2">
            <span className="text-gray-700 dark:text-gray-300 truncate">{entry.title}</span>
            <span
              className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0"
              title={new Date(entry.createdAt).toLocaleString('pt-BR')}
            >
              {formatRelative(entry.createdAt)}
            </span>
          </div>
        </div>
      ))}

      {!expanded && remaining > 0 && (
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            setExpanded(true);
          }}
          className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
        >
          + ver mais {remaining} {remaining === 1 ? 'evento' : 'eventos'}
        </button>
      )}
      {expanded && entries.length > PREVIEW_COUNT && (
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            setExpanded(false);
          }}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          recolher
        </button>
      )}
    </div>
  );
};
