import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { ShortlistDTO, ShortlistStatus } from '../../types/api';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  EmptyState,
  Skeleton,
} from '../ui';

interface JobShortlistProps {
  jobId: number;
  onSendCandidates: () => void;
  refreshKey?: number;
}

const STATUS_LABELS: Record<ShortlistStatus, string> = {
  [ShortlistStatus.SENT]: 'Enviado',
  [ShortlistStatus.VIEWED]: 'Visualizado',
  [ShortlistStatus.UNDER_REVIEW]: 'Em Analise',
  [ShortlistStatus.INTERVIEW_REQUESTED]: 'Entrevista Sol.',
  [ShortlistStatus.APPROVED]: 'Aprovado',
  [ShortlistStatus.REJECTED]: 'Rejeitado',
  [ShortlistStatus.WITHDRAWN]: 'Retirado',
};

const STATUS_BADGE_VARIANT: Record<ShortlistStatus, React.ComponentProps<typeof Badge>['variant']> = {
  [ShortlistStatus.SENT]: 'info',
  [ShortlistStatus.VIEWED]: 'info',
  [ShortlistStatus.UNDER_REVIEW]: 'active',
  [ShortlistStatus.INTERVIEW_REQUESTED]: 'featured',
  [ShortlistStatus.APPROVED]: 'active',
  [ShortlistStatus.REJECTED]: 'blacklisted',
  [ShortlistStatus.WITHDRAWN]: 'inactive',
};

const STATUS_OPTIONS: { value: ShortlistStatus; label: string }[] = [
  { value: ShortlistStatus.SENT, label: 'Enviado' },
  { value: ShortlistStatus.VIEWED, label: 'Visualizado' },
  { value: ShortlistStatus.UNDER_REVIEW, label: 'Em Analise' },
  { value: ShortlistStatus.INTERVIEW_REQUESTED, label: 'Entrevista Solicitada' },
  { value: ShortlistStatus.APPROVED, label: 'Aprovado' },
  { value: ShortlistStatus.REJECTED, label: 'Rejeitado' },
  { value: ShortlistStatus.WITHDRAWN, label: 'Retirado' },
];

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

const GRADIENT_CLASSES = [
  'from-brand-400 to-brand-600',
  'from-theme-purple-400 to-theme-purple-600',
  'from-success-400 to-success-600',
  'from-warning-400 to-warning-600',
  'from-error-400 to-error-600',
];

const getGradient = (id: number): string => GRADIENT_CLASSES[id % GRADIENT_CLASSES.length];

const plusIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export const JobShortlist: React.FC<JobShortlistProps> = ({ jobId, onSendCandidates, refreshKey }) => {
  const [shortlist, setShortlist] = useState<ShortlistDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchShortlist = async () => {
    try {
      setLoading(true);
      const data = await apiService.getShortlistsByJob(jobId);
      setShortlist(data);
    } catch (err) {
      console.error('Error fetching shortlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlist();
  }, [jobId, refreshKey]);

  const handleStatusChange = async (id: number, newStatus: ShortlistStatus) => {
    setUpdatingId(id);
    try {
      await apiService.updateShortlistStatus(id, newStatus);
      setShortlist((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      console.error('Error updating shortlist status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">Candidatos Enviados</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-8 w-28 rounded-lg" />
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
          <Button variant="primary" size="sm" icon={plusIcon} onClick={onSendCandidates}>
            Enviar Candidatos
          </Button>
        }
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">Candidatos Enviados</h2>
      </CardHeader>
      <CardBody>
        {shortlist.length === 0 ? (
          <EmptyState
            title="Nenhum candidato enviado"
            description="Ainda nao ha candidatos na shortlist desta vaga."
            actionLabel="Enviar Candidatos"
            onAction={onSendCandidates}
          />
        ) : (
          <div className="space-y-3">
            {shortlist.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-white/[0.02] transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {item.candidateProfilePictureUrl ? (
                    <img
                      src={item.candidateProfilePictureUrl}
                      alt={item.candidateName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradient(item.candidateId)} flex items-center justify-center text-white text-sm font-semibold`}
                    >
                      {getInitials(item.candidateName)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">
                      {item.candidateName}
                    </span>
                    <Badge variant={STATUS_BADGE_VARIANT[item.status]}>
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </div>
                  {item.candidateEmail && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                      {item.candidateEmail}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Enviado em {new Date(item.sentAt).toLocaleDateString('pt-BR')}
                    {item.headhunterName && ` por ${item.headhunterName}`}
                  </p>
                  {item.clientFeedback && (
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-white/5 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Feedback: </span>
                      {item.clientFeedback}
                    </p>
                  )}
                  {item.notes && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Status selector */}
                <div className="flex-shrink-0">
                  <select
                    value={item.status}
                    disabled={updatingId === item.id}
                    onChange={(e) => handleStatusChange(item.id, e.target.value as ShortlistStatus)}
                    className="text-xs rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-gray-700 transition-colors focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 disabled:opacity-50 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
