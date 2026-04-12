import React from 'react';
import { useDrop } from 'react-dnd';
import { JobDTO } from '../../types/api';
import { KanbanJobCard, JOB_ITEM_TYPE } from './KanbanJobCard';

interface DragItem {
  id: number;
  currentStatus: string;
  currentPipelineStage: string;
}

interface KanbanColumnProps {
  title: string;
  columnKey: string;
  jobs: JobDTO[];
  onDrop: (jobId: number, targetColumn: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, columnKey, jobs, onDrop }) => {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: JOB_ITEM_TYPE,
      drop: (item: DragItem) => {
        onDrop(item.id, columnKey);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [columnKey, onDrop]
  );

  const isDropTarget = isOver && canDrop;

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      className={`flex-shrink-0 w-72 rounded-xl border-2 transition-colors duration-200 ${
        isDropTarget
          ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 border-dashed'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
      }`}
    >
      <div className="px-4 py-3 rounded-t-xl bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">{title}</h3>
          <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full px-2 py-0.5 font-bold">
            {jobs.length}
          </span>
        </div>
      </div>

      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
        {jobs.map((job) => (
          <KanbanJobCard key={job.id} job={job} />
        ))}
        {jobs.length === 0 && (
          <p
            className={`text-xs text-center py-8 ${
              isDropTarget ? 'text-brand-500' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {isDropTarget ? 'Solte aqui' : 'Nenhuma vaga'}
          </p>
        )}
      </div>
    </div>
  );
};
