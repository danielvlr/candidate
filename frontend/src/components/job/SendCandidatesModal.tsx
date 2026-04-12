import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../../services/api';
import { CandidateDTO } from '../../types/api';
import { Button, Input, useToast, Skeleton } from '../ui';

interface SendCandidatesModalProps {
  jobId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const getInitials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

const GRADIENT_CLASSES = [
  'from-brand-400 to-brand-600',
  'from-theme-purple-400 to-theme-purple-600',
  'from-success-400 to-success-600',
  'from-warning-400 to-warning-600',
  'from-error-400 to-error-600',
];

const getGradient = (id: number): string => GRADIENT_CLASSES[id % GRADIENT_CLASSES.length];

const checkIcon = (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

const searchIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const SendCandidatesModal: React.FC<SendCandidatesModalProps> = ({
  jobId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CandidateDTO[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState('');
  const [presentationText, setPresentationText] = useState('');
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedIds(new Set());
      setNotes('');
      setPresentationText('');
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

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await apiService.searchCandidates(query, { size: 10 });
        setSearchResults(result.content);
      } catch (err) {
        console.error('Error searching candidates:', err);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const toggleCandidate = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      addToast({ type: 'error', title: 'Selecione ao menos um candidato' });
      return;
    }
    setLoading(true);
    try {
      await apiService.createShortlist({
        jobId,
        candidateIds: Array.from(selectedIds),
        headhunterId: 1,
        notes: notes.trim() || undefined,
        presentationText: presentationText.trim() || undefined,
      });
      addToast({ type: 'success', title: `${selectedIds.size} candidato(s) enviado(s) com sucesso` });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating shortlist:', err);
      addToast({ type: 'error', title: 'Erro ao enviar candidatos' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-theme-xl animate-slide-up dark:border-gray-700 dark:bg-gray-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
              Enviar Candidatos
            </h3>
            {selectedIds.size > 0 && (
              <p className="text-xs text-brand-500 mt-0.5 font-medium">
                {selectedIds.size} candidato(s) selecionado(s)
              </p>
            )}
          </div>
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

        {/* Scrollable form content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Search */}
            <div>
              <Input
                label="Buscar Candidatos"
                name="search"
                placeholder="Digite o nome ou email do candidato..."
                value={searchQuery}
                icon={searchIcon}
                onChange={(e) => handleSearch(e.target.value)}
              />

              {/* Search results */}
              {(searching || searchResults.length > 0 || searchQuery.trim()) && (
                <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {searching ? (
                    <div className="p-3 space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-2/3" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchResults.length === 0 && searchQuery.trim() ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      Nenhum candidato encontrado para "{searchQuery}"
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                      {searchResults.map((candidate) => {
                        const isSelected = selectedIds.has(candidate.id!);
                        return (
                          <button
                            key={candidate.id}
                            type="button"
                            onClick={() => toggleCandidate(candidate.id!)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                              isSelected
                                ? 'bg-brand-50 dark:bg-brand-500/10'
                                : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                            }`}
                          >
                            {/* Checkbox */}
                            <div
                              className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'border-brand-500 bg-brand-500 text-white'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            >
                              {isSelected && checkIcon}
                            </div>

                            {/* Avatar */}
                            {candidate.profilePictureUrl ? (
                              <img
                                src={candidate.profilePictureUrl}
                                alt={candidate.fullName}
                                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-9 h-9 rounded-full bg-gradient-to-br ${getGradient(candidate.id!)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
                              >
                                {getInitials(candidate.fullName)}
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">
                                {candidate.fullName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {candidate.email}
                                {candidate.headline && ` • ${candidate.headline}`}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected candidates summary */}
            {selectedIds.size > 0 && (
              <div className="rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 px-4 py-3">
                <p className="text-sm font-medium text-brand-700 dark:text-brand-400">
                  {selectedIds.size} candidato(s) selecionado(s) para envio
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs text-brand-600 dark:text-brand-400 underline mt-0.5 hover:no-underline"
                >
                  Limpar selecao
                </button>
              </div>
            )}

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Observacoes
                <span className="ml-1.5 text-xs font-normal text-gray-400">(opcional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Observacoes internas sobre o envio..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-colors duration-200 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-700"
              />
            </div>

            {/* Presentation text */}
            <div>
              <label
                htmlFor="presentationText"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Texto de Apresentacao
                <span className="ml-1.5 text-xs font-normal text-gray-400">(opcional)</span>
              </label>
              <textarea
                id="presentationText"
                name="presentationText"
                rows={3}
                placeholder="Texto de apresentacao para o cliente..."
                value={presentationText}
                onChange={(e) => setPresentationText(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-colors duration-200 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-700"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={loading}
              disabled={selectedIds.size === 0}
            >
              Enviar {selectedIds.size > 0 ? `${selectedIds.size} Candidato(s)` : 'Candidatos'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
