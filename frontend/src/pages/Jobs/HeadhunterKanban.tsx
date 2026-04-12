import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { JobDTO } from '../../types/api';
import { KanbanColumn } from './KanbanColumn';
import { KanbanViewToggle } from './KanbanViewToggle';
import { KanbanFilters } from './KanbanFilters';
import { useToast } from '../../components/ui/Toast';
import apiService from '../../services/api';

const STATUS_COLUMNS = [
  { key: 'DRAFT', label: 'Rascunho' },
  { key: 'ACTIVE', label: 'Ativa' },
  { key: 'PAUSED', label: 'Pausada' },
  { key: 'CLOSED', label: 'Fechada' },
  { key: 'EXPIRED', label: 'Expirada' },
];

const PIPELINE_COLUMNS = [
  { key: 'SOURCING', label: 'Prospecção' },
  { key: 'SCREENING', label: 'Triagem' },
  { key: 'SHORTLISTED', label: 'Shortlist' },
  { key: 'INTERVIEW', label: 'Entrevista' },
  { key: 'OFFER', label: 'Proposta' },
  { key: 'HIRED', label: 'Contratado' },
  { key: 'WARRANTY', label: 'Garantia' },
];

// TODO: Replace with real headhunter id from auth context when available
const DEFAULT_HEADHUNTER_ID = 1;

const HeadhunterKanban: React.FC = () => {
  const { addToast } = useToast();
  const [view, setView] = useState<'status' | 'pipeline'>('status');
  const [jobsByColumn, setJobsByColumn] = useState<Record<string, JobDTO[]>>({});
  const [loading, setLoading] = useState(true);

  const [createdFilter, setCreatedFilter] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState('');
  const [warrantyFilter, setWarrantyFilter] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: { createdAfter?: string; deadlineBefore?: string; warrantyExpiringIn?: number } = {};

      if (createdFilter) {
        const date = new Date();
        date.setDate(date.getDate() - parseInt(createdFilter, 10));
        params.createdAfter = date.toISOString().split('T')[0];
      }
      if (deadlineFilter) {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(deadlineFilter, 10));
        params.deadlineBefore = date.toISOString().split('T')[0];
      }
      if (warrantyFilter) {
        params.warrantyExpiringIn = parseInt(warrantyFilter, 10);
      }

      const data =
        view === 'status'
          ? await apiService.getJobsKanban(DEFAULT_HEADHUNTER_ID, params)
          : await apiService.getJobsKanbanPipeline(DEFAULT_HEADHUNTER_ID, params);

      setJobsByColumn(data);
    } catch (error) {
      console.error('Failed to fetch kanban data:', error);
      addToast({ type: 'error', title: 'Erro ao carregar vagas', message: 'Tente novamente.' });
    } finally {
      setLoading(false);
    }
  }, [view, createdFilter, deadlineFilter, warrantyFilter, addToast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDrop = async (jobId: number, targetColumn: string) => {
    try {
      if (view === 'status') {
        await apiService.updateJobStatus(jobId, targetColumn);
      } else {
        await apiService.updateJobPipelineStage(jobId, targetColumn);
      }
      await fetchJobs();
      addToast({ type: 'success', title: 'Vaga atualizada com sucesso.' });
    } catch (error: unknown) {
      console.error('Failed to update job:', error);
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar vaga';
      addToast({ type: 'error', title: 'Erro ao mover vaga', message });
    }
  };

  const clearFilters = () => {
    setCreatedFilter('');
    setDeadlineFilter('');
    setWarrantyFilter('');
  };

  const columns = view === 'status' ? STATUS_COLUMNS : PIPELINE_COLUMNS;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kanban de Vagas</h1>
        <KanbanViewToggle view={view} onViewChange={setView} />
      </div>

      <div className="mb-4">
        <KanbanFilters
          createdFilter={createdFilter}
          deadlineFilter={deadlineFilter}
          warrantyFilter={warrantyFilter}
          onCreatedFilterChange={setCreatedFilter}
          onDeadlineFilterChange={setDeadlineFilter}
          onWarrantyFilterChange={setWarrantyFilter}
          onClearFilters={clearFilters}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : (
        <DndProvider backend={HTML5Backend}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((col) => (
              <KanbanColumn
                key={col.key}
                title={col.label}
                columnKey={col.key}
                jobs={jobsByColumn[col.key] ?? []}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </DndProvider>
      )}
    </div>
  );
};

export default HeadhunterKanban;
