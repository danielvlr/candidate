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

interface PillOption {
  value: string;
  label: string;
}

const CREATED_OPTIONS: PillOption[] = [
  { value: '', label: 'Tudo' },
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
];

const DEADLINE_OPTIONS: PillOption[] = [
  { value: '', label: 'Tudo' },
  { value: '7', label: 'Esta semana' },
  { value: '15', label: '15 dias' },
  { value: '30', label: 'Este mês' },
];

const WARRANTY_OPTIONS: PillOption[] = [
  { value: '', label: 'Tudo' },
  { value: '10', label: '10 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
];

const formatPtBr = (date: Date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const resolveCreatedAfter = (days: string): string =>
  formatPtBr(new Date(Date.now() - parseInt(days, 10) * 86400000));

const resolveDeadlineBefore = (days: string): string =>
  formatPtBr(new Date(Date.now() + parseInt(days, 10) * 86400000));

interface PillGroupProps {
  label: string;
  icon: string;
  options: PillOption[];
  value: string;
  onChange: (v: string) => void;
}

const PillGroup: React.FC<PillGroupProps> = ({ label, icon, options, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
      {icon} {label}
    </span>
    <div className="inline-flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value || 'all'}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              active
                ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

interface ActiveChipProps {
  label: string;
  onRemove: () => void;
  tone: 'neutral' | 'warning' | 'danger';
}

const ActiveChip: React.FC<ActiveChipProps> = ({ label, onRemove, tone }) => {
  const tones = {
    neutral: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${tones[tone]}`}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:opacity-70 transition-opacity"
        aria-label="Remover filtro"
      >
        ×
      </button>
    </span>
  );
};

export const KanbanFilters: React.FC<KanbanFiltersProps> = ({
  createdFilter,
  deadlineFilter,
  warrantyFilter,
  onCreatedFilterChange,
  onDeadlineFilterChange,
  onWarrantyFilterChange,
  onClearFilters,
}) => {
  const hasFilters = Boolean(createdFilter || deadlineFilter || warrantyFilter);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <PillGroup
          label="Criação"
          icon="📅"
          options={CREATED_OPTIONS}
          value={createdFilter}
          onChange={onCreatedFilterChange}
        />
        <PillGroup
          label="Deadline da vaga"
          icon="⏰"
          options={DEADLINE_OPTIONS}
          value={deadlineFilter}
          onChange={onDeadlineFilterChange}
        />
        <PillGroup
          label="Reposição (garantia)"
          icon="🛡️"
          options={WARRANTY_OPTIONS}
          value={warrantyFilter}
          onChange={onWarrantyFilterChange}
        />
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Filtros ativos:</span>
          {createdFilter && (
            <ActiveChip
              tone="neutral"
              label={`Criadas desde ${resolveCreatedAfter(createdFilter)}`}
              onRemove={() => onCreatedFilterChange('')}
            />
          )}
          {deadlineFilter && (
            <ActiveChip
              tone="warning"
              label={`Deadline até ${resolveDeadlineBefore(deadlineFilter)}`}
              onRemove={() => onDeadlineFilterChange('')}
            />
          )}
          {warrantyFilter && (
            <ActiveChip
              tone="danger"
              label={`Garantia vence em ≤${warrantyFilter} dias`}
              onRemove={() => onWarrantyFilterChange('')}
            />
          )}
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs text-gray-500 hover:text-error-600 dark:text-gray-400 dark:hover:text-error-400 transition-colors underline"
          >
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  );
};
