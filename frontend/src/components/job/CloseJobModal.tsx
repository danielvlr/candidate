import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import type { CandidateDTO } from '../../types/api';
import { Modal, useToast } from '../ui';

interface CloseJobModalProps {
  isOpen: boolean;
  jobId: number;
  jobValue?: number;
  onClose: () => void;
  onClosed: () => void;
}

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500';

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

/** Fechamento de vaga: exige o valor final e o candidato aprovado (abre a garantia no backend). */
export function CloseJobModal({ isOpen, jobId, jobValue, onClose, onClosed }: CloseJobModalProps) {
  const { addToast } = useToast();
  const [finalValue, setFinalValue] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CandidateDTO[]>([]);
  const [searching, setSearching] = useState(false);
  const [approved, setApproved] = useState<CandidateDTO | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFinalValue('');
      setQuery('');
      setResults([]);
      setApproved(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const term = query.trim();
    if (approved || term.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      apiService
        .searchCandidates(term, { page: 0, size: 8 })
        .then((page) => !cancelled && setResults(page.content ?? []))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setSearching(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, approved]);

  const handleConfirm = async () => {
    const parsed = parseFloat(finalValue.replace(',', '.'));
    if (!finalValue || Number.isNaN(parsed) || parsed < 0) {
      addToast({ type: 'error', title: 'Valor de fechamento obrigatório', message: 'Informe um valor maior ou igual a zero.' });
      return;
    }
    if (!approved?.id) {
      addToast({ type: 'error', title: 'Candidato aprovado obrigatório', message: 'Selecione o candidato aprovado na vaga.' });
      return;
    }
    setSaving(true);
    try {
      await apiService.closeJobWithValue(jobId, { finalValue: parsed, approvedCandidateId: approved.id });
      addToast({ type: 'success', title: 'Vaga fechada', message: `Candidato aprovado: ${approved.fullName}` });
      onClosed();
    } catch {
      addToast({ type: 'error', title: 'Erro ao fechar vaga' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fechar Vaga"
      description="Informe o valor final e o candidato aprovado. A garantia começa a contar na data do fechamento."
      confirmLabel="Fechar Vaga"
      cancelLabel="Cancelar"
      onConfirm={handleConfirm}
      variant="danger"
      loading={saving}
    >
      <div className="mt-4 space-y-4">
        {jobValue != null && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Valor previsto:</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatBRL(jobValue)}</span>
          </div>
        )}

        <div>
          <label htmlFor="close-final-value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valor de fechamento (R$) <span className="text-red-500">*</span>
          </label>
          <input
            id="close-final-value"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 8500.00"
            value={finalValue}
            onChange={(e) => setFinalValue(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="close-approved-candidate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Candidato aprovado <span className="text-red-500">*</span>
          </label>
          {approved ? (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-emerald-800 dark:text-emerald-300">{approved.fullName}</p>
                <p className="truncate text-xs text-emerald-700/80 dark:text-emerald-400/80">{approved.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setApproved(null)}
                className="ml-3 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-300"
              >
                Trocar
              </button>
            </div>
          ) : (
            <>
              <input
                id="close-approved-candidate"
                type="text"
                autoComplete="off"
                placeholder="Busque pelo nome ou e-mail do candidato"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={INPUT_CLASS}
              />
              {searching && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Buscando...</p>}
              {!searching && query.trim().length >= MIN_SEARCH_LENGTH && results.length === 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Nenhum candidato encontrado.</p>
              )}
              {results.length > 0 && (
                <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  {results.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setApproved(c)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <span className="block text-sm text-gray-900 dark:text-white/90">{c.fullName}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{c.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
