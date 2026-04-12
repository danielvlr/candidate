import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import { HistoryType, HistoryStatus } from '../../types/api';
import { Button, Input, Select, useToast } from '../ui';

interface AddActivityModalProps {
  jobId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const HISTORY_TYPE_OPTIONS: { value: HistoryType; label: string }[] = [
  { value: HistoryType.NOTE, label: 'Nota' },
  { value: HistoryType.INTERVIEW_SCHEDULED, label: 'Entrevista Agendada' },
  { value: HistoryType.INTERVIEW_COMPLETED, label: 'Entrevista Realizada' },
  { value: HistoryType.FEEDBACK_RECEIVED, label: 'Feedback Recebido' },
  { value: HistoryType.STATUS_CHANGED, label: 'Status Alterado' },
  { value: HistoryType.SHORTLIST_SENT, label: 'Shortlist Enviada' },
  { value: HistoryType.CANDIDATE_APPLIED, label: 'Candidato Inscrito' },
  { value: HistoryType.CANDIDATE_CONTACTED, label: 'Candidato Contatado' },
  { value: HistoryType.CLIENT_MEETING, label: 'Reuniao com Cliente' },
  { value: HistoryType.TECHNICAL_TEST, label: 'Teste Tecnico' },
  { value: HistoryType.REFERENCE_CHECK, label: 'Checagem de Referencias' },
  { value: HistoryType.OFFER_MADE, label: 'Proposta Enviada' },
  { value: HistoryType.OFFER_ACCEPTED, label: 'Proposta Aceita' },
  { value: HistoryType.OFFER_REJECTED, label: 'Proposta Recusada' },
  { value: HistoryType.CONTRACT_SIGNED, label: 'Contrato Assinado' },
  { value: HistoryType.CANDIDATE_STARTED, label: 'Candidato Contratado' },
  { value: HistoryType.GUARANTEE_PERIOD, label: 'Periodo de Garantia' },
  { value: HistoryType.OTHER, label: 'Outro' },
];

const TYPES_WITH_SCHEDULED_DATE = new Set([
  HistoryType.INTERVIEW_SCHEDULED,
  HistoryType.CLIENT_MEETING,
]);

interface FormState {
  type: HistoryType;
  title: string;
  description: string;
  scheduledDate: string;
}

const initialForm: FormState = {
  type: HistoryType.NOTE,
  title: '',
  description: '',
  scheduledDate: '',
};

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  jobId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [form, setForm] = useState<FormState>(initialForm);
  const [titleError, setTitleError] = useState('');
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setTitleError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showScheduledDate = TYPES_WITH_SCHEDULED_DATE.has(form.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setTitleError('Titulo e obrigatorio');
      return;
    }
    setTitleError('');
    setLoading(true);
    try {
      await apiService.createJobHistory({
        jobId,
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        scheduledDate: showScheduledDate && form.scheduledDate ? form.scheduledDate : undefined,
        status: HistoryStatus.COMPLETED,
      });
      addToast({ type: 'success', title: 'Atividade adicionada com sucesso' });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating job history:', err);
      addToast({ type: 'error', title: 'Erro ao adicionar atividade' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-theme-xl animate-slide-up dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
            Adicionar Atividade
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Select
            label="Tipo de Atividade"
            name="type"
            required
            value={form.type}
            options={HISTORY_TYPE_OPTIONS}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as HistoryType }))}
          />

          <Input
            label="Titulo"
            name="title"
            required
            placeholder="Descreva brevemente a atividade"
            value={form.title}
            error={titleError}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, title: e.target.value }));
              if (titleError) setTitleError('');
            }}
          />

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Descricao
              <span className="ml-1.5 text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Detalhes adicionais sobre a atividade..."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-colors duration-200 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-700"
            />
          </div>

          {showScheduledDate && (
            <Input
              label="Data Agendada"
              name="scheduledDate"
              type="datetime-local"
              value={form.scheduledDate}
              onChange={(e) => setForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
              helperText="Data e hora para a atividade agendada"
            />
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={loading}>
              Salvar Atividade
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
