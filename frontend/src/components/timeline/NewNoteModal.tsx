import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import { HistoryType, HistoryStatus, JobDTO } from '../../types/api';
import { Button, Input, useToast } from '../ui';

interface NewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientId: number;
  clientJobs: JobDTO[];
}

type NoteTarget = 'empresa' | 'vaga';

interface FormState {
  target: NoteTarget;
  jobId: string;
  title: string;
  description: string;
}

const initialForm: FormState = {
  target: 'empresa',
  jobId: '',
  title: '',
  description: '',
};

export const NewNoteModal: React.FC<NewNoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  clientJobs,
}) => {
  const { addToast } = useToast();
  const [form, setForm] = useState<FormState>(initialForm);
  const [descriptionError, setDescriptionError] = useState('');
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setDescriptionError('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      setDescriptionError('Descricao e obrigatoria');
      return;
    }
    setDescriptionError('');
    setLoading(true);

    try {
      if (form.target === 'empresa') {
        await apiService.createClientHistory({
          clientId,
          type: HistoryType.NOTE,
          title: form.title.trim() || undefined,
          description: form.description.trim(),
          status: HistoryStatus.COMPLETED,
        });
      } else {
        const selectedJobId = parseInt(form.jobId, 10);
        if (!selectedJobId) {
          addToast({ type: 'error', title: 'Selecione uma vaga' });
          setLoading(false);
          return;
        }
        await apiService.createJobHistory({
          jobId: selectedJobId,
          type: HistoryType.NOTE,
          title: form.title.trim() || 'Nota',
          description: form.description.trim() || undefined,
          status: HistoryStatus.COMPLETED,
        });
      }

      addToast({ type: 'success', title: 'Nota criada com sucesso' });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating note:', err);
      addToast({ type: 'error', title: 'Erro ao criar nota' });
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
            Nova Nota
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
          {/* Target radio */}
          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Relacionada a
            </span>
            <div className="flex gap-3">
              {([
                { value: 'empresa', label: 'Sobre a empresa' },
                { value: 'vaga', label: 'Sobre uma vaga' },
              ] as { value: NoteTarget; label: string }[]).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                    form.target === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="target"
                    value={opt.value}
                    checked={form.target === opt.value}
                    onChange={() => setForm((prev) => ({ ...prev, target: opt.value, jobId: '' }))}
                    className="sr-only"
                  />
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      form.target === opt.value
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-gray-400 dark:border-gray-500'
                    }`}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Job selector (only when vaga) */}
          {form.target === 'vaga' && (
            <div>
              <label
                htmlFor="jobId"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Vaga <span className="text-error-500">*</span>
              </label>
              <select
                id="jobId"
                value={form.jobId}
                onChange={(e) => setForm((prev) => ({ ...prev, jobId: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 transition-colors duration-200 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90"
              >
                <option value="">Selecione uma vaga...</option>
                {clientJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
              {clientJobs.length === 0 && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Nenhuma vaga encontrada para esta empresa.
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <Input
            label="Titulo"
            name="title"
            placeholder="Titulo da nota (opcional)"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Descricao <span className="text-error-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Descreva a nota..."
              value={form.description}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, description: e.target.value }));
                if (descriptionError) setDescriptionError('');
              }}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-colors duration-200 focus:outline-none focus:ring-3 dark:text-white/90 dark:placeholder:text-white/30 ${
                descriptionError
                  ? 'border-error-300 focus:border-error-300 focus:ring-error-500/10 dark:border-error-700'
                  : 'border-gray-300 bg-white focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:focus:border-brand-700'
              }`}
            />
            {descriptionError && (
              <p className="mt-1 text-xs text-error-500">{descriptionError}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={loading}>
              Salvar Nota
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
