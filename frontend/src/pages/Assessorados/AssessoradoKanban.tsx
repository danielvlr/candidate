import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AssessoradoDTO, AssessoradoPhase } from '../../types/api';
import KanbanColumn from './KanbanColumn';
import { PHASE_ORDER } from './mockData';

interface AssessoradoKanbanProps {
  assessorados: AssessoradoDTO[];
  onPhaseChange: (id: number, fromPhase: AssessoradoPhase, toPhase: AssessoradoPhase) => void;
}

const AssessoradoKanban: React.FC<AssessoradoKanbanProps> = ({ assessorados, onPhaseChange }) => {
  const grouped = PHASE_ORDER.reduce<Record<AssessoradoPhase, AssessoradoDTO[]>>(
    (acc, phase) => {
      acc[phase] = assessorados.filter((a) => a.currentPhase === phase);
      return acc;
    },
    {} as Record<AssessoradoPhase, AssessoradoDTO[]>
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="pb-4 min-w-0 overflow-hidden">
        <div className="flex gap-3 min-w-0">
          {PHASE_ORDER.map((phase) => (
            <KanbanColumn
              key={phase}
              phase={phase}
              assessorados={grouped[phase]}
              onDrop={onPhaseChange}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default AssessoradoKanban;
