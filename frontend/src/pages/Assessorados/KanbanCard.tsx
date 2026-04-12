import React from 'react';
import { useDrag } from 'react-dnd';
import { useNavigate } from 'react-router-dom';
import { AssessoradoDTO, AssessoradoStatus } from '../../types/api';
import { Badge } from '../../components/ui';
import { STATUS_LABELS, STATUS_BADGE } from './mockData';

const AVATAR_GRADIENTS = [
  'from-brand-400 to-brand-600',
  'from-purple-400 to-purple-600',
  'from-teal-400 to-teal-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
];

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const getGradient = (name: string) =>
  AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

export const ITEM_TYPE = 'assessorado';

interface KanbanCardProps {
  assessorado: AssessoradoDTO;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ assessorado }) => {
  const navigate = useNavigate();
  const name = assessorado.candidate?.fullName ?? 'Candidato';

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: assessorado.id, currentPhase: assessorado.currentPhase },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [assessorado.id, assessorado.currentPhase]);

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all duration-150 ${
        isDragging ? 'opacity-40 scale-95' : 'opacity-100'
      }`}
      onClick={() => navigate(`/assessorados/${assessorado.id}`)}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${getGradient(name)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
        >
          {getInitials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate">
            {name}
          </h4>
          {assessorado.candidate?.headline && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {assessorado.candidate.headline}
            </p>
          )}
          {assessorado.specializations && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
              {assessorado.specializations}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <Badge variant={STATUS_BADGE[assessorado.status]}>
          {STATUS_LABELS[assessorado.status]}
        </Badge>
        {assessorado.status === AssessoradoStatus.PAUSED && (
          <span className="text-xs text-orange-500">Pausado</span>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
