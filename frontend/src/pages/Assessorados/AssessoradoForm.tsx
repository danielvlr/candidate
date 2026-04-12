import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import {
  AssessoradoDTO,
  AssessoradoCreateRequest,
  AssessoradoPhase,
  CandidateDTO,
  HeadhunterDTO,
  PageResponse,
} from '../../types/api';
import {
  Input,
  Textarea,
  Select,
  Button,
  Card,
  CardBody,
} from '../../components/ui';

interface AssessoradoFormProps {
  mode: 'create' | 'edit';
}

const PHASE_OPTIONS = [
  { value: AssessoradoPhase.ONBOARDING, label: 'Onboarding' },
  { value: AssessoradoPhase.ACTIVE_SEARCH, label: 'Busca Ativa' },
  { value: AssessoradoPhase.INTERVIEW_PREP, label: 'Preparação para Entrevista' },
  { value: AssessoradoPhase.NEGOTIATION, label: 'Negociação' },
  { value: AssessoradoPhase.PLACED, label: 'Colocado' },
  { value: AssessoradoPhase.COMPLETED, label: 'Concluído' },
];

const DEBOUNCE_MS = 400;

const AssessoradoForm: React.FC<AssessoradoFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Form state
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [candidateDisplay, setCandidateDisplay] = useState('');
  const [seniorId, setSeniorId] = useState<number | null>(null);
  const [advisoryStartDate, setAdvisoryStartDate] = useState('');
  const [advisoryEndDate, setAdvisoryEndDate] = useState('');
  const [currentPhase, setCurrentPhase] = useState<AssessoradoPhase>(
    AssessoradoPhase.ONBOARDING
  );
  const [specializations, setSpecializations] = useState('');
  const [objectives, setObjectives] = useState('');
  const [notes, setNotes] = useState('');

  // Candidate search
  const [candidateQuery, setCandidateQuery] = useState('');
  const [candidateResults, setCandidateResults] = useState<CandidateDTO[]>([]);
  const [searchingCandidates, setSearchingCandidates] = useState(false);
  const [showCandidateDropdown, setShowCandidateDropdown] = useState(false);
  const candidateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Headhunters / seniors
  const [headhunters, setHeadhunters] = useState<HeadhunterDTO[]>([]);

  // Page state
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(mode === 'edit');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load headhunters list for senior dropdown
  useEffect(() => {
    const loadHeadhunters = async () => {
      try {
        const result: PageResponse<HeadhunterDTO> = await apiService.getHeadhunters({
          page: 0,
          size: 100,
        });
        setHeadhunters(result.content);
      } catch (err) {
        console.error('Error loading headhunters:', err);
      }
    };
    loadHeadhunters();
  }, []);

  // Load assessorado in edit mode
  useEffect(() => {
    if (mode === 'edit' && id) {
      const load = async () => {
        try {
          setPageLoading(true);
          const assessorado: AssessoradoDTO = await apiService.getAssessoradoById(
            parseInt(id)
          );
          setCandidateId(assessorado.candidateId);
          setCandidateDisplay(
            assessorado.candidate?.fullName ?? `Candidato #${assessorado.candidateId}`
          );
          setSeniorId(assessorado.seniorId);
          setAdvisoryStartDate(assessorado.advisoryStartDate ?? '');
          setAdvisoryEndDate(assessorado.advisoryEndDate ?? '');
          setCurrentPhase(assessorado.currentPhase);
          setSpecializations(assessorado.specializations ?? '');
          setObjectives(assessorado.objectives ?? '');
          setNotes(assessorado.notes ?? '');
        } catch (err) {
          setError('Erro ao carregar assessorado');
          console.error('Error loading assessorado:', err);
        } finally {
          setPageLoading(false);
        }
      };
      load();
    }
  }, [mode, id]);

  // Debounced candidate search
  useEffect(() => {
    if (mode !== 'create') return;
    if (!candidateQuery.trim()) {
      setCandidateResults([]);
      setShowCandidateDropdown(false);
      return;
    }

    if (candidateDebounceRef.current) {
      clearTimeout(candidateDebounceRef.current);
    }

    candidateDebounceRef.current = setTimeout(async () => {
      try {
        setSearchingCandidates(true);
        const result = await apiService.searchCandidates(candidateQuery, {
          page: 0,
          size: 8,
        });
        setCandidateResults(result.content);
        setShowCandidateDropdown(true);
      } catch (err) {
        console.error('Error searching candidates:', err);
      } finally {
        setSearchingCandidates(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (candidateDebounceRef.current) {
        clearTimeout(candidateDebounceRef.current);
      }
    };
  }, [candidateQuery, mode]);

  const handleSelectCandidate = (candidate: CandidateDTO) => {
    setCandidateId(candidate.id ?? null);
    setCandidateDisplay(candidate.fullName);
    setCandidateQuery(candidate.fullName);
    setShowCandidateDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!candidateId) {
      setError('Selecione um candidato');
      return;
    }
    if (!seniorId) {
      setError('Selecione um senior responsável');
      return;
    }
    if (!advisoryStartDate) {
      setError('Informe a data de início da assessoria');
      return;
    }

    const request: AssessoradoCreateRequest = {
      candidateId,
      seniorId,
      advisoryStartDate,
      advisoryEndDate: advisoryEndDate || undefined,
      currentPhase,
      specializations: specializations || undefined,
      objectives: objectives || undefined,
      notes: notes || undefined,
    };

    try {
      setLoading(true);
      setError(null);

      if (mode === 'create') {
        await apiService.createAssessorado(request);
        setSuccessMessage('Assessorado criado com sucesso!');
      } else if (id) {
        await apiService.updateAssessorado(parseInt(id), request);
        setSuccessMessage('Assessorado atualizado com sucesso!');
      }

      setTimeout(() => navigate('/assessorados'), 800);
    } catch (err) {
      setError(
        mode === 'create'
          ? 'Erro ao criar assessorado'
          : 'Erro ao atualizar assessorado'
      );
      console.error('Error saving assessorado:', err);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-500" />
      </div>
    );
  }

  const seniorOptions = [
    { value: '', label: 'Selecione um senior...' },
    ...headhunters.map((h) => ({
      value: String(h.id),
      label: h.fullName,
    })),
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white/90 mb-2">
            {mode === 'create' ? 'Novo Assessorado' : 'Editar Assessorado'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {mode === 'create'
              ? 'Vincule um candidato a um senior para iniciar a assessoria.'
              : 'Edite as informações da assessoria.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-800 dark:bg-success-900/20 dark:text-success-400">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Candidato */}
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-6">
                Candidato
              </h3>

              {mode === 'create' ? (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Buscar Candidato <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o nome do candidato..."
                    value={candidateQuery}
                    onChange={(e) => {
                      setCandidateQuery(e.target.value);
                      if (candidateId) {
                        setCandidateId(null);
                        setCandidateDisplay('');
                      }
                    }}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500"
                  />
                  {searchingCandidates && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Buscando...
                    </p>
                  )}
                  {candidateId && (
                    <p className="mt-1 text-xs text-success-600 dark:text-success-400">
                      Selecionado: {candidateDisplay}
                    </p>
                  )}

                  {/* Dropdown */}
                  {showCandidateDropdown && candidateResults.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                      {candidateResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCandidate(c)}
                          className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white/90 truncate">
                              {c.fullName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {c.email}
                              {c.headline ? ` • ${c.headline}` : ''}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {showCandidateDropdown &&
                    candidateResults.length === 0 &&
                    !searchingCandidates && (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nenhum candidato encontrado
                        </p>
                      </div>
                    )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Candidato
                  </label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {candidateDisplay}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Senior Responsavel */}
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-6">
                Senior Responsável
              </h3>

              {mode === 'create' ? (
                <Select
                  label="Senior"
                  required
                  value={seniorId !== null ? String(seniorId) : ''}
                  onChange={(e) =>
                    setSeniorId(e.target.value ? parseInt(e.target.value) : null)
                  }
                  options={seniorOptions}
                />
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Senior
                  </label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
                    {headhunters.find((h) => h.id === seniorId)?.fullName ??
                      (seniorId ? `Senior #${seniorId}` : '—')}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Dados da Assessoria */}
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-6">
                Dados da Assessoria
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Data de Início"
                  required
                  type="date"
                  value={advisoryStartDate}
                  onChange={(e) => setAdvisoryStartDate(e.target.value)}
                />

                <Input
                  label="Data de Término (opcional)"
                  type="date"
                  value={advisoryEndDate}
                  onChange={(e) => setAdvisoryEndDate(e.target.value)}
                />

                <div className="md:col-span-2">
                  <Select
                    label="Fase Atual"
                    value={currentPhase}
                    onChange={(e) =>
                      setCurrentPhase(e.target.value as AssessoradoPhase)
                    }
                    options={PHASE_OPTIONS}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <Textarea
                  label="Especializações"
                  rows={3}
                  value={specializations}
                  onChange={(e) => setSpecializations(e.target.value)}
                  placeholder="Áreas de especialização para esta assessoria..."
                />

                <Textarea
                  label="Objetivos"
                  rows={3}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder="Objetivos e metas da assessoria..."
                />

                <Textarea
                  label="Notas"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações adicionais..."
                />
              </div>
            </CardBody>
          </Card>

          {/* Sticky footer */}
          <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 px-6 -mx-6 -mb-6 rounded-b-xl flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/assessorados')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              loading={loading}
            >
              {loading
                ? 'Salvando...'
                : mode === 'create'
                ? 'Criar Assessorado'
                : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssessoradoForm;
