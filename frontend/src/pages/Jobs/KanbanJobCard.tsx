import React from 'react';
import { useDrag } from 'react-dnd';
import { JobDTO } from '../../types/api';

export const JOB_ITEM_TYPE = 'JOB_CARD';

interface KanbanJobCardProps {
  job: JobDTO;
}

const categoryColors: Record<string, string> = {
  PROJETOS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  NOSSO_HEADHUNTER: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  TATICAS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  EXECUTIVAS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

type Tone = 'safe' | 'warn' | 'danger' | 'expired';

const toneClasses: Record<Tone, string> = {
  safe: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  warn: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  expired: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 line-through',
};

const daysBetween = (target: Date, now: Date) =>
  Math.ceil((target.getTime() - now.getTime()) / 86400000);

const toneFor = (daysLeft: number): Tone => {
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 7) return 'danger';
  if (daysLeft <= 30) return 'warn';
  return 'safe';
};

const formatDeadline = (daysLeft: number): string => {
  if (daysLeft < 0) return `Vencida há ${Math.abs(daysLeft)}d`;
  if (daysLeft === 0) return 'Vence hoje';
  if (daysLeft === 1) return 'Vence amanhã';
  return `Vence em ${daysLeft}d`;
};

const formatWarranty = (daysLeft: number): string => {
  if (daysLeft < 0) return `Garantia expirou há ${Math.abs(daysLeft)}d`;
  if (daysLeft === 0) return 'Garantia expira hoje';
  return `Reposição: ${daysLeft}d restantes`;
};

interface BadgeProps {
  tone: Tone;
  icon: string;
  label: string;
  title: string;
}

const Badge: React.FC<BadgeProps> = ({ tone, icon, label, title }) => (
  <span
    title={title}
    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${toneClasses[tone]}`}
  >
    <span aria-hidden>{icon}</span>
    {label}
  </span>
);

export const KanbanJobCard: React.FC<KanbanJobCardProps> = ({ job }) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: JOB_ITEM_TYPE,
      item: { id: job.id, currentStatus: job.status, currentPipelineStage: job.pipelineStage },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [job.id, job.status, job.pipelineStage]
  );

  const now = new Date();
  const daysSinceCreation =
    job.createdAt
      ? Math.floor((now.getTime() - new Date(job.createdAt).getTime()) / 86400000)
      : null;

  const deadlineDaysLeft =
    job.applicationDeadline ? daysBetween(new Date(job.applicationDeadline), now) : null;

  let warrantyDaysLeft: number | null = null;
  let warrantyEndPtBr = '';
  if (job.closedAt && job.guaranteeDays != null) {
    const warrantyEnd = new Date(job.closedAt);
    warrantyEnd.setDate(warrantyEnd.getDate() + job.guaranteeDays);
    warrantyDaysLeft = daysBetween(warrantyEnd, now);
    warrantyEndPtBr = warrantyEnd.toLocaleDateString('pt-BR');
  }

  const categoryColor =
    job.serviceCategory
      ? categoryColors[job.serviceCategory] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      : '';

  const deadlinePtBr = job.applicationDeadline
    ? new Date(job.applicationDeadline).toLocaleDateString('pt-BR')
    : '';

  const closedWithoutEmail =
    job.status === 'CLOSED' && !job.client?.contactEmail;

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-3 cursor-grab active:cursor-grabbing transition-opacity hover:shadow-md ${
        closedWithoutEmail
          ? 'border-red-400 dark:border-red-500/60 ring-1 ring-red-200 dark:ring-red-900/40'
          : 'border-gray-200 dark:border-gray-700'
      } ${isDragging ? 'opacity-40' : 'opacity-100'}`}
    >
      {closedWithoutEmail && (
        <div
          className="flex items-start gap-1.5 mb-2 px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[11px] font-medium border border-red-200 dark:border-red-800"
          title="Vaga fechada sem e-mail de contato cadastrado para a empresa. Cadastre para envio de garantia/cobrança."
        >
          <span aria-hidden>⚠️</span>
          <span className="leading-tight">Cliente sem e-mail cadastrado</span>
        </div>
      )}
      <h4 className="font-medium text-sm text-gray-900 dark:text-white/90 mb-1 line-clamp-2">
        {job.title}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{job.companyName}</p>

      <div className="flex flex-wrap gap-1 mb-2">
        {job.serviceCategory && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor}`}>
            {job.serviceCategory.replace('_', ' ')}
          </span>
        )}
        {job.urgent && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300 font-medium">
            Urgente
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1 mb-2">
        {deadlineDaysLeft !== null && (
          <Badge
            tone={toneFor(deadlineDaysLeft)}
            icon="⏰"
            label={formatDeadline(deadlineDaysLeft)}
            title={`Deadline: ${deadlinePtBr}`}
          />
        )}
        {warrantyDaysLeft !== null && (
          <Badge
            tone={toneFor(warrantyDaysLeft)}
            icon="🛡️"
            label={formatWarranty(warrantyDaysLeft)}
            title={`Fim da garantia: ${warrantyEndPtBr}`}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-2">
          {daysSinceCreation !== null && (
            <span title={job.createdAt ? new Date(job.createdAt).toLocaleDateString('pt-BR') : ''}>
              Criada há {daysSinceCreation}d
            </span>
          )}
          {job.applicationsCount != null && job.applicationsCount > 0 && (
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-1.5 py-0.5">
              {job.applicationsCount} cand.
            </span>
          )}
        </div>
        {job.client?.contactPersonName && (
          <span
            className="text-gray-500 dark:text-gray-400 truncate max-w-[100px]"
            title={job.client.contactPersonName}
          >
            {job.client.contactPersonName}
          </span>
        )}
      </div>
    </div>
  );
};
