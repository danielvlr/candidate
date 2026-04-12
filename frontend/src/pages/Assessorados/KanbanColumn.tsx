import React from 'react';
import { useDrop } from 'react-dnd';
import { AssessoradoDTO, AssessoradoPhase } from '../../types/api';
import KanbanCard, { ITEM_TYPE } from './KanbanCard';
import { PHASE_LABELS, PHASE_COLORS } from './mockData';

interface DragItem {
  id: number;
  currentPhase: AssessoradoPhase;
}

interface KanbanColumnProps {
  phase: AssessoradoPhase;
  assessorados: AssessoradoDTO[];
  onDrop: (itemId: number, fromPhase: AssessoradoPhase, toPhase: AssessoradoPhase) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ phase, assessorados, onDrop }) => {
  const colors = PHASE_COLORS[phase];

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: DragItem) => {
      if (item.currentPhase !== phase) {
        onDrop(item.id, item.currentPhase, phase);
      }
    },
    canDrop: (item: DragItem) => item.currentPhase !== phase,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [phase, onDrop]);

  const isDropTarget = isOver && canDrop;

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      className={`flex flex-col flex-1 min-w-0 rounded-xl border-2 transition-colors duration-200 ${
        isDropTarget
          ? `${colors.border} ${colors.bg} border-dashed`
          : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
      }`}
    >
      {/* Column Header */}
      <div className={`px-4 py-3 rounded-t-xl ${colors.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
            <h3 className={`text-sm font-semibold ${colors.text}`}>
              {PHASE_LABELS[phase]}
            </h3>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
            {assessorados.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {assessorados.map((assessorado) => (
          <KanbanCard key={assessorado.id} assessorado={assessorado} />
        ))}
        {assessorados.length === 0 && (
          <div className={`text-center py-8 text-xs ${isDropTarget ? colors.text : 'text-gray-400 dark:text-gray-500'}`}>
            {isDropTarget ? 'Solte aqui' : 'Nenhum assessorado'}
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
