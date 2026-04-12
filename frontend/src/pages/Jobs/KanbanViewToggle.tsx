import React from 'react';

interface KanbanViewToggleProps {
  view: 'status' | 'pipeline';
  onViewChange: (view: 'status' | 'pipeline') => void;
}

export const KanbanViewToggle: React.FC<KanbanViewToggleProps> = ({ view, onViewChange }) => {
  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          view === 'status'
            ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
        onClick={() => onViewChange('status')}
      >
        Status da Vaga
      </button>
      <button
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          view === 'pipeline'
            ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
        onClick={() => onViewChange('pipeline')}
      >
        Pipeline
      </button>
    </div>
  );
};
