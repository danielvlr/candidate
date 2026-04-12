import React from 'react';

interface KanbanFiltersProps {
  createdFilter: string;
  deadlineFilter: string;
  warrantyFilter: string;
  onCreatedFilterChange: (value: string) => void;
  onDeadlineFilterChange: (value: string) => void;
  onWarrantyFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export const KanbanFilters: React.FC<KanbanFiltersProps> = ({
  createdFilter,
  deadlineFilter,
  warrantyFilter,
  onCreatedFilterChange,
  onDeadlineFilterChange,
  onWarrantyFilterChange,
  onClearFilters,
}) => {
  const hasFilters = createdFilter || deadlineFilter || warrantyFilter;

  const selectClass =
    'rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 shadow-sm px-3 py-2 focus:border-brand-500 focus:ring-brand-500 focus:outline-none';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={createdFilter}
        onChange={(e) => onCreatedFilterChange(e.target.value)}
        className={selectClass}
      >
        <option value="">Criado: Todos</option>
        <option value="7">Últimos 7 dias</option>
        <option value="30">Últimos 30 dias</option>
        <option value="60">Últimos 60 dias</option>
        <option value="90">Últimos 90 dias</option>
      </select>

      <select
        value={deadlineFilter}
        onChange={(e) => onDeadlineFilterChange(e.target.value)}
        className={selectClass}
      >
        <option value="">Deadline: Todos</option>
        <option value="7">Próximos 7 dias</option>
        <option value="15">Próximos 15 dias</option>
        <option value="30">Próximos 30 dias</option>
      </select>

      <select
        value={warrantyFilter}
        onChange={(e) => onWarrantyFilterChange(e.target.value)}
        className={selectClass}
      >
        <option value="">Garantia: Todos</option>
        <option value="10">Expirando em 10 dias</option>
        <option value="30">Expirando em 30 dias</option>
        <option value="60">Expirando em 60 dias</option>
      </select>

      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="text-sm text-gray-500 hover:text-error-600 dark:text-gray-400 dark:hover:text-error-400 transition-colors"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
};
