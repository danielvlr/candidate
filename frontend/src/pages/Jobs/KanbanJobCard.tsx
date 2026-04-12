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

  const daysSinceCreation =
    job.createdAt
      ? Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

  const categoryColor =
    job.serviceCategory
      ? categoryColors[job.serviceCategory] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      : '';

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 cursor-grab active:cursor-grabbing transition-opacity hover:shadow-md ${
        isDragging ? 'opacity-40' : 'opacity-100'
      }`}
    >
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

      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-2">
          {daysSinceCreation !== null && <span>{daysSinceCreation}d atrás</span>}
          {job.applicationDeadline && (
            <span className="text-orange-500 dark:text-orange-400">
              {new Date(job.applicationDeadline).toLocaleDateString('pt-BR')}
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
