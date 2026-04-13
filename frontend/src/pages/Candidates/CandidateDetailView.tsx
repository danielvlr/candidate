import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { CandidateDTO } from '../../types/api';
import { Badge, Button, Card, CardBody } from '../../components/ui';

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const AVATAR_GRADIENTS = [
  'from-brand-400 to-brand-600',
  'from-purple-400 to-purple-600',
  'from-teal-400 to-teal-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
];

const getGradient = (name: string) =>
  AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

const statusLabel: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  HIRED: 'Contratado',
  BLACKLISTED: 'Bloqueado',
};

const statusVariant: Record<string, string> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  HIRED: 'info',
  BLACKLISTED: 'blacklisted',
};

const workPrefLabel: Record<string, string> = {
  REMOTE: 'Remoto',
  ONSITE: 'Presencial',
  HYBRID: 'Hibrido',
};

const CandidateDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<CandidateDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [timeline, setTimeline] = useState<{ id: string; type: 'app' | 'log'; status: string; label: string; subtitle: string; date: string; badgeColor: string; badgeLabel: string; headhunterName: string }[]>([]);

  useEffect(() => {
    if (id) {
      const cid = parseInt(id);
      loadCandidate(cid);
      loadTimeline(cid);
    }
  }, [id]);

  const loadCandidate = async (candidateId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCandidateById(candidateId);
      setCandidate(data);
    } catch (err) {
      setError('Erro ao carregar candidato');
      console.error('Error loading candidate:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async (candidateId: number) => {
    try {
      const [statusData, appsRes] = await Promise.all([
        apiService.getCandidateStatusHistory(candidateId),
        fetch(`/api/v1/applications/candidate/${candidateId}?page=0&size=50`).then(r => r.json()).catch(() => ({ content: [] })),
      ]);

      const items: typeof timeline = [];

      // Add job applications
      (appsRes.content || []).forEach((a: any, i: number) => {
        const st = a.status || 'APPLIED';
        const statusLabel = st === 'HIRED' ? 'Aprovado' : st === 'SHORTLISTED' ? 'Candidato apresentado' : st === 'INTERVIEW_SCHEDULED' ? 'Entrevista com empresa' : st === 'UNDER_REVIEW' ? 'Checagem de referencias' : 'Candidato mapeado';
        const badgeLabel = st === 'HIRED' ? 'Aprovado' : st === 'SHORTLISTED' ? 'Apresentado' : st === 'INTERVIEW_SCHEDULED' ? 'Entrevista' : st === 'UNDER_REVIEW' ? 'Checagem' : 'Mapeado';
        const badgeColor = st === 'HIRED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
          st === 'SHORTLISTED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
          st === 'INTERVIEW_SCHEDULED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
          'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        items.push({
          id: `app-${i}`, type: 'app', status: st, label: statusLabel,
          subtitle: `${a.job?.companyName || ''} - ${a.job?.title || 'Vaga'}`,
          date: a.appliedAt || a.job?.createdAt || '',
          badgeColor, badgeLabel,
          headhunterName: a.job?.headhunter?.fullName || '',
        });
      });

      // Collect headhunter name from applications as fallback
      const defaultHH = (appsRes.content || []).map((a: any) => a.job?.headhunter?.fullName).filter(Boolean)[0] || '';

      // Add status logs
      statusData.forEach((h: any) => {
        const dotColor = h.status === 'Aprovado' ? 'bg-emerald-500' : h.status === 'Entrevista com empresa' ? 'bg-amber-500' : h.status === 'Candidato apresentado' ? 'bg-blue-500' : h.status === 'Candidato mapeado' ? 'bg-purple-500' : h.status === 'Checagem de referências' ? 'bg-teal-500' : 'bg-gray-400';
        items.push({
          id: `log-${h.id}`, type: 'log', status: h.status || '', label: h.status || 'Sem status',
          subtitle: '',
          date: h.createdAt || '',
          badgeColor: dotColor, badgeLabel: '',
          headhunterName: h.createdBy || defaultHH,
        });
      });

      // Sort by date descending
      items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setTimeline(items);
    } catch (err) {
      console.error('Error loading timeline:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!candidate?.id) return;
    try {
      setSavingNotes(true);
      await apiService.updateCandidate(candidate.id, { ...candidate, summary: notesText });
      setCandidate({ ...candidate, summary: notesText });
      setEditingNotes(false);
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando candidato...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error || 'Candidato nao encontrado'}</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/candidates')}>
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/candidates')}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            {candidate.profilePictureUrl ? (
              <img src={candidate.profilePictureUrl} alt={candidate.fullName} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradient(candidate.fullName)} flex items-center justify-center text-white font-semibold text-sm`}>
                {getInitials(candidate.fullName)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{candidate.fullName}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.headline || candidate.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[candidate.status || 'ACTIVE'] as any}>
            {statusLabel[candidate.status || 'ACTIVE']}
          </Badge>
          <Button variant="primary" size="sm" onClick={() => navigate(`/candidates/${candidate.id}/edit`)}>
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Informacoes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Email</h3>
                  <a href={`mailto:${candidate.email}`} className="text-sm text-brand-600 hover:underline">{candidate.email}</a>
                </div>
                {candidate.headline && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Cargo Atual</h3>
                    <p className="text-sm text-gray-900 dark:text-white">{candidate.headline}</p>
                  </div>
                )}
                {candidate.desiredSalary != null && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Pretensao Salarial</h3>
                    <p className="text-sm text-gray-900 dark:text-white">{formatCurrency(candidate.desiredSalary)}</p>
                  </div>
                )}
                {candidate.workPreference && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Preferencia</h3>
                    <p className="text-sm text-gray-900 dark:text-white">{workPrefLabel[candidate.workPreference] || candidate.workPreference}</p>
                  </div>
                )}
                {(candidate.city || candidate.state) && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Localizacao</h3>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {[candidate.city, candidate.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {candidate.linkedinUrl && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">LinkedIn</h3>
                    <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline truncate block">
                      {candidate.linkedinUrl}
                    </a>
                  </div>
                )}
                {candidate.githubUrl && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">GitHub</h3>
                    <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline truncate block">
                      {candidate.githubUrl}
                    </a>
                  </div>
                )}
                {candidate.skills && (
                  <div className="sm:col-span-2">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Habilidades</h3>
                    <p className="text-sm text-gray-900 dark:text-white">{candidate.skills}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Historico de Movimentacao (unified timeline) */}
          {timeline.length > 0 && (
            <Card>
              <CardBody>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                  Historico de Movimentacao ({timeline.length})
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {timeline.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${item.badgeColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                        {item.subtitle && (
                          <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">{item.subtitle}</p>
                        )}
                        {item.headhunterName && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">por {item.headhunterName}</p>
                        )}
                      </div>
                      {item.date && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                          {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Notas / Summary */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notas</h2>
                {!editingNotes && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setNotesText(candidate.summary || ''); setEditingNotes(true); }}
                  >
                    {candidate.summary ? 'Editar' : 'Adicionar nota'}
                  </Button>
                )}
              </div>
              {editingNotes ? (
                <div>
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white p-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    placeholder="Escreva notas sobre este candidato..."
                  />
                  <div className="flex gap-2 mt-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEditingNotes(false)} disabled={savingNotes}>
                      Cancelar
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSaveNotes} loading={savingNotes} disabled={savingNotes}>
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : candidate.summary ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{candidate.summary}</p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma nota adicionada.</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardBody>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Detalhes</h2>
              <div className="space-y-3">
                {candidate.dateOfBirth && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Nascimento</span>
                    <span className="text-sm text-gray-900 dark:text-white">{new Date(candidate.dateOfBirth).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                {candidate.availabilityDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Disponibilidade</span>
                    <span className="text-sm text-gray-900 dark:text-white">{new Date(candidate.availabilityDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Relocacao</span>
                  <span className="text-sm text-gray-900 dark:text-white">{candidate.willingToRelocate ? 'Sim' : 'Nao'}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {candidate.createdAt && (
            <Card>
              <CardBody>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Datas</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Criado em</h3>
                    <p className="text-sm text-gray-900 dark:text-white">{new Date(candidate.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {candidate.updatedAt && (
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Atualizado em</h3>
                      <p className="text-sm text-gray-900 dark:text-white">{new Date(candidate.updatedAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailView;
