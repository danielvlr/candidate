import { useState, useEffect } from "react";

// Types based on backend DTOs
interface JobDetailData {
  // Job information
  id: number;
  title: string;
  description: string;
  companyName: string;
  client?: {
    id: number;
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    city: string;
    state: string;
  };
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType: string;
  workMode: string;
  experienceLevel: string;
  requirements?: string;
  benefits?: string;
  responsibilities?: string;
  skillsRequired?: string;
  status: string;
  applicationDeadline?: string;
  startDate?: string;
  contactEmail?: string;
  isUrgent: boolean;
  isFeatured: boolean;
  viewsCount: number;
  applicationsCount: number;
  jobValue?: number;
  guaranteeDays: number;
  createdAt: string;
  updatedAt: string;
  headhunter?: {
    id: number;
    fullName: string;
    email: string;
  };

  // Related data
  applications: JobApplication[];
  shortlists: Shortlist[];
  history: JobHistory[];

  // Statistics
  totalApplications: number;
  totalShortlists: number;
  totalHistory: number;
  shortlistsApproved: number;
  shortlistsRejected: number;
  shortlistsPending: number;
}

interface JobApplication {
  id: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateProfilePictureUrl?: string;
  candidateHeadline?: string;
  candidateCity?: string;
  status: string;
  coverLetter?: string;
  notes?: string;
  appliedAt: string;
  reviewedAt?: string;
  interviewDate?: string;
  feedback?: string;
  rating?: number;
}

interface Shortlist {
  id: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateProfilePictureUrl?: string;
  status: string;
  sentAt: string;
  viewedAt?: string;
  respondedAt?: string;
  notes?: string;
  clientFeedback?: string;
  positionInShortlist?: number;
  presentationText?: string;
}

interface JobHistory {
  id: number;
  headhunterId?: number;
  headhunterName?: string;
  candidateId?: number;
  candidateName?: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
  scheduledDate?: string;
  completedAt?: string;
  status: string;
  metadata?: string;
}

interface JobDetailViewProps {
  jobId: number;
  onBack: () => void;
}

// API service to fetch job detail data
const fetchJobDetail = async (jobId: number): Promise<JobDetailData> => {
  const response = await fetch(`/api/v1/jobs/${jobId}/detail`);
  if (!response.ok) {
    throw new Error('Failed to fetch job detail');
  }
  return await response.json();
};

// API service to create job history
const createJobHistory = async (data: {
  jobId: number;
  headhunterId?: number;
  candidateId?: number;
  type: string;
  title: string;
  description?: string;
  scheduledDate?: string;
}) => {
  const response = await fetch('/api/v1/job-history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create job history');
  }
  return await response.json();
};

// API service to search candidates
const searchCandidates = async (query: string) => {
  const response = await fetch(`/api/v1/candidates/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search candidates');
  }
  return await response.json();
};

// API service to add candidate to job
const addCandidateToJob = async (jobId: number, candidateId: number) => {
  const response = await fetch('/api/v1/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jobId,
      candidateId,
      coverLetter: null
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('API Error:', response.status, errorData);
    throw new Error(`HTTP ${response.status}: ${errorData || 'Failed to add candidate to job'}`);
  }

  return await response.json();
};

// API service to create shortlist
const createShortlist = async (data: {
  jobId: number;
  candidateIds: number[];
  headhunterId: number;
  notes?: string;
  presentationText?: string;
}) => {
  const response = await fetch('/api/v1/shortlists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create shortlist');
  }
  return await response.json();
};

export default function JobDetailView({ jobId, onBack }: JobDetailViewProps) {
  const [jobDetail, setJobDetail] = useState<JobDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'shortlists' | 'history'>('candidates');
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [showAddCandidateForm, setShowAddCandidateForm] = useState(false);
  const [showQuickHistoryForm, setShowQuickHistoryForm] = useState(false);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [candidateSearchResults, setCandidateSearchResults] = useState<any[]>([]);
  const [historyForm, setHistoryForm] = useState({
    type: 'NOTE',
    title: '',
    description: '',
    candidateId: '',
    scheduledDate: '',
  });
  const [quickHistoryForm, setQuickHistoryForm] = useState({
    type: 'NOTE',
    title: '',
    description: '',
  });
  const [showCreateShortlistModal, setShowCreateShortlistModal] = useState(false);
  const [selectedCandidatesForShortlist, setSelectedCandidatesForShortlist] = useState<number[]>([]);
  const [shortlistForm, setShortlistForm] = useState({
    notes: '',
    presentationText: '',
  });
  const [addingCandidate, setAddingCandidate] = useState(false);

  useEffect(() => {
    loadJobDetail();
  }, [jobId]);

  const loadJobDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJobDetail(jobId);
      setJobDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job detail');
      console.error('Error loading job detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJobHistory({
        jobId,
        candidateId: historyForm.candidateId ? parseInt(historyForm.candidateId) : undefined,
        type: historyForm.type,
        title: historyForm.title,
        description: historyForm.description,
        scheduledDate: historyForm.scheduledDate || undefined,
      });

      // Reset form and reload data
      setHistoryForm({
        type: 'NOTE',
        title: '',
        description: '',
        candidateId: '',
        scheduledDate: '',
      });
      setShowHistoryForm(false);
      loadJobDetail();
    } catch (err) {
      console.error('Error creating history:', err);
      alert('Erro ao criar histórico');
    }
  };

  const handleQuickHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJobHistory({
        jobId,
        type: quickHistoryForm.type,
        title: quickHistoryForm.title,
        description: quickHistoryForm.description,
      });

      // Reset form and reload data
      setQuickHistoryForm({
        type: 'NOTE',
        title: '',
        description: '',
      });
      setShowQuickHistoryForm(false);
      loadJobDetail();
    } catch (err) {
      console.error('Error creating history:', err);
      alert('Erro ao criar histórico');
    }
  };

  const handleCandidateSearch = async (query: string) => {
    setCandidateSearchQuery(query);
    if (query.length >= 2) {
      try {
        const results = await searchCandidates(query);
        setCandidateSearchResults(results.content || results);
      } catch (err) {
        console.error('Error searching candidates:', err);
        setCandidateSearchResults([]);
      }
    } else {
      setCandidateSearchResults([]);
    }
  };

  const handleAddCandidateToJob = async (candidateId: number) => {
    if (addingCandidate) return; // Previne cliques múltiplos

    try {
      setAddingCandidate(true);
      console.log('Adding candidate to job:', { jobId, candidateId });

      const result = await addCandidateToJob(jobId, candidateId);
      console.log('Result:', result);

      setShowAddCandidateForm(false);
      setCandidateSearchQuery('');
      setCandidateSearchResults([]);

      // Recarregar dados
      await loadJobDetail();

      alert('✅ Candidato adicionado à vaga com sucesso!');
    } catch (err) {
      console.error('Error adding candidate to job:', err);

      // Tratamento mais detalhado do erro
      let errorMessage = 'Erro ao adicionar candidato à vaga';

      if (err instanceof Error) {
        if (err.message.includes('400')) {
          errorMessage = 'Candidato já está vinculado a esta vaga';
        } else if (err.message.includes('404')) {
          errorMessage = 'Candidato ou vaga não encontrado';
        } else if (err.message.includes('500')) {
          errorMessage = 'Erro interno do servidor. Tente novamente.';
        }
      }

      alert('❌ ' + errorMessage);
    } finally {
      setAddingCandidate(false);
    }
  };

  const handleCandidateSelectionForShortlist = (candidateId: number) => {
    setSelectedCandidatesForShortlist(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  };

  const handleCreateShortlist = async () => {
    if (selectedCandidatesForShortlist.length === 0) {
      alert('Selecione pelo menos um candidato para o shortlist');
      return;
    }

    try {
      await createShortlist({
        jobId,
        candidateIds: selectedCandidatesForShortlist,
        headhunterId: 1, // TODO: Get from auth context
        notes: shortlistForm.notes,
        presentationText: shortlistForm.presentationText,
      });

      setShowCreateShortlistModal(false);
      setSelectedCandidatesForShortlist([]);
      setShortlistForm({ notes: '', presentationText: '' });
      loadJobDetail();
      alert('Shortlist criado com sucesso!');
    } catch (err) {
      console.error('Error creating shortlist:', err);
      alert('Erro ao criar shortlist');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'viewed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando detalhes da vaga...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao Dashboard
          </button>
        </div>
        <div className="text-red-500">Erro ao carregar detalhes da vaga: {error}</div>
      </div>
    );
  }

  if (!jobDetail) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao Dashboard
          </button>
        </div>
        <div className="text-red-500">Dados da vaga não encontrados</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao Dashboard
        </button>

        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(jobDetail.status)}`}>
            {jobDetail.status}
          </span>
          {jobDetail.isUrgent && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              Urgente
            </span>
          )}
          {jobDetail.isFeatured && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              Destaque
            </span>
          )}
        </div>
      </div>

      {/* Job title and basic info - Compacto */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{jobDetail.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{jobDetail.companyName}</span>
              <span>•</span>
              <span>{jobDetail.location}</span>
              <span>•</span>
              <span>{jobDetail.jobType}</span>
              <span>•</span>
              <span>{jobDetail.workMode}</span>
            </div>
          </div>

          <div className="text-right">
            {(jobDetail.salaryMin || jobDetail.salaryMax) && (
              <p className="text-base font-semibold text-green-600">
                {jobDetail.salaryMin && jobDetail.salaryMax
                  ? `${formatCurrency(jobDetail.salaryMin)} - ${formatCurrency(jobDetail.salaryMax)}`
                  : jobDetail.salaryMin
                    ? `A partir de ${formatCurrency(jobDetail.salaryMin)}`
                    : `Até ${formatCurrency(jobDetail.salaryMax!)}`
                }
              </p>
            )}
          </div>
        </div>

        {/* Statistics cards divididos em 2 seções */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Card 1: Candidatos e Shortlists */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Candidatos & Shortlists
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{jobDetail.totalApplications}</p>
                <p className="text-xs text-gray-600">Candidatos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{jobDetail.totalShortlists}</p>
                <p className="text-xs text-gray-600">Shortlists</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{jobDetail.shortlistsApproved}</p>
                <p className="text-xs text-gray-600">Aprovados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco 1: Candidatos e Shortlists */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'candidates', name: 'Candidatos', icon: '👥', count: jobDetail.totalApplications },
                { id: 'shortlists', name: 'Shortlists', icon: '📤', count: jobDetail.totalShortlists },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                  {tab.count !== undefined && (
                    <span className="bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">

            {activeTab === 'candidates' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Candidatos Vinculados ({jobDetail.applications.length})
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAddCandidateForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Adicionar Candidato</span>
                    </button>

                    {selectedCandidatesForShortlist.length > 0 && (
                      <button
                        onClick={() => setShowCreateShortlistModal(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Criar Shortlist ({selectedCandidatesForShortlist.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {jobDetail.applications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCandidatesForShortlist(jobDetail.applications.map(app => app.candidateId));
                                } else {
                                  setSelectedCandidatesForShortlist([]);
                                }
                              }}
                              checked={selectedCandidatesForShortlist.length === jobDetail.applications.length && jobDetail.applications.length > 0}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Candidato
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aplicado em
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avaliação
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {jobDetail.applications.map((application) => (
                          <tr key={application.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedCandidatesForShortlist.includes(application.candidateId)}
                                onChange={() => handleCandidateSelectionForShortlist(application.candidateId)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {application.candidateProfilePictureUrl ? (
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={application.candidateProfilePictureUrl}
                                    alt={application.candidateName}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-gray-600 font-medium">
                                      {application.candidateName.charAt(0)}
                                    </span>
                                  </div>
                                )}
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {application.candidateName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {application.candidateEmail}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(application.status)}`}>
                                {application.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(application.appliedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {application.rating ? (
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <svg
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < application.rating! ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                  <span className="ml-2 text-sm text-gray-600">{application.rating}/5</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">Não avaliado</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum candidato vinculado a esta vaga.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shortlists' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Shortlists Enviados ({jobDetail.shortlists.length})
                  </h3>
                  <div className="flex space-x-2 text-sm">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                      ✅ {jobDetail.shortlistsApproved}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                      ❌ {jobDetail.shortlistsRejected}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      ⏳ {jobDetail.shortlistsPending}
                    </span>
                  </div>
                </div>

                {jobDetail.shortlists.length > 0 ? (
                  <div className="space-y-3">
                    {jobDetail.shortlists.map((shortlist) => (
                      <div key={shortlist.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            {shortlist.candidateProfilePictureUrl ? (
                              <img
                                className="h-8 w-8 rounded-full"
                                src={shortlist.candidateProfilePictureUrl}
                                alt={shortlist.candidateName}
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-xs text-gray-600 font-medium">
                                  {shortlist.candidateName.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div className="ml-3 flex-1">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-gray-900">
                                  {shortlist.candidateName}
                                </span>
                                {shortlist.positionInShortlist && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                    #{shortlist.positionInShortlist}
                                  </span>
                                )}
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(shortlist.status)}`}>
                                  {shortlist.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Enviado em {formatDate(shortlist.sentAt)}
                                {shortlist.clientFeedback && (
                                  <span className="ml-2 text-gray-700">
                                    • {shortlist.clientFeedback}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum shortlist foi enviado para esta vaga.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Container 2: Histórico */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">📝</span>
                Histórico da Vaga
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {jobDetail.totalHistory}
                </span>
              </h3>
            </div>
          </div>

          <div className="p-6">

            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-medium text-gray-700">
                Entradas do Histórico ({jobDetail.history.length})
              </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowQuickHistoryForm(true)}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    ⚡ Rápido
                  </button>
                  <button
                    onClick={() => setShowHistoryForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Adicionar Histórico
                  </button>
                </div>
              </div>

              {/* History timeline */}
              {jobDetail.history.length > 0 ? (
                <div className="space-y-4">
                  {jobDetail.history.map((item) => (
                    <div key={item.id} className="border-l-4 border-blue-200 pl-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          {item.candidateName && (
                            <p className="text-xs text-gray-500 mt-1">
                              Candidato: {item.candidateName}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateTime(item.createdAt)}
                          </p>
                          {item.scheduledDate && (
                            <p className="text-xs text-blue-600 mt-1">
                              Agendado: {formatDateTime(item.scheduledDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum histórico registrado para esta vaga.
                </div>
              )}
          </div>
        </div>
      </div>

      {/* History form modal */}
      {showHistoryForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <form onSubmit={handleHistorySubmit}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Histórico</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={historyForm.type}
                  onChange={(e) => setHistoryForm({...historyForm, type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="NOTE">Anotação</option>
                  <option value="INTERVIEW_SCHEDULED">Entrevista Agendada</option>
                  <option value="INTERVIEW_COMPLETED">Entrevista Realizada</option>
                  <option value="FEEDBACK_RECEIVED">Feedback Recebido</option>
                  <option value="CLIENT_MEETING">Reunião com Cliente</option>
                  <option value="CANDIDATE_CONTACTED">Candidato Contatado</option>
                  <option value="TECHNICAL_TEST">Teste Técnico</option>
                  <option value="OFFER_MADE">Proposta Feita</option>
                  <option value="OTHER">Outros</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={historyForm.title}
                  onChange={(e) => setHistoryForm({...historyForm, title: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={historyForm.description}
                  onChange={(e) => setHistoryForm({...historyForm, description: e.target.value})}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidato (opcional)
                </label>
                <select
                  value={historyForm.candidateId}
                  onChange={(e) => setHistoryForm({...historyForm, candidateId: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione um candidato</option>
                  {jobDetail.applications.map((app) => (
                    <option key={app.candidateId} value={app.candidateId}>
                      {app.candidateName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data agendada (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={historyForm.scheduledDate}
                  onChange={(e) => setHistoryForm({...historyForm, scheduledDate: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowHistoryForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick History form modal */}
      {showQuickHistoryForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <form onSubmit={handleQuickHistorySubmit}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Histórico Rápido</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={quickHistoryForm.type}
                  onChange={(e) => setQuickHistoryForm({...quickHistoryForm, type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="NOTE">Anotação</option>
                  <option value="FEEDBACK_RECEIVED">Feedback Recebido</option>
                  <option value="CLIENT_MEETING">Reunião com Cliente</option>
                  <option value="CANDIDATE_CONTACTED">Candidato Contatado</option>
                  <option value="OTHER">Outros</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={quickHistoryForm.title}
                  onChange={(e) => setQuickHistoryForm({...quickHistoryForm, title: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Ex: Cliente deu feedback positivo"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={quickHistoryForm.description}
                  onChange={(e) => setQuickHistoryForm({...quickHistoryForm, description: e.target.value})}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detalhes adicionais..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowQuickHistoryForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  ⚡ Salvar Rápido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Candidate modal - Melhorado */}
      {showAddCandidateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Adicionar Candidato à Vaga
                </h3>
                <button
                  onClick={() => {
                    setShowAddCandidateForm(false);
                    setCandidateSearchQuery('');
                    setCandidateSearchResults([]);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Search Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🔍 Buscar Candidato
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={candidateSearchQuery}
                    onChange={(e) => handleCandidateSearch(e.target.value)}
                    className="w-full p-4 pl-12 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Digite o nome ou email do candidato..."
                    autoFocus
                  />
                  <svg className="absolute left-4 top-4 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {candidateSearchQuery.length > 0 && candidateSearchQuery.length < 2 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Digite pelo menos 2 caracteres para buscar
                  </p>
                )}
              </div>

              {/* Search Results */}
              {candidateSearchResults.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    📊 Resultados da Busca ({candidateSearchResults.length})
                  </h4>
                  <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                    {candidateSearchResults.map((candidate, index) => (
                      <div
                        key={candidate.id}
                        className={`p-4 transition-colors border-b border-gray-100 last:border-b-0 ${
                          addingCandidate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer'
                        } ${
                          index === 0 ? 'rounded-t-lg' : ''
                        } ${
                          index === candidateSearchResults.length - 1 ? 'rounded-b-lg' : ''
                        }`}
                        onClick={() => !addingCandidate && handleAddCandidateToJob(candidate.id)}
                      >
                        <div className="flex items-center">
                          {candidate.profilePictureUrl ? (
                            <img
                              className="h-12 w-12 rounded-full border-2 border-gray-200"
                              src={candidate.profilePictureUrl}
                              alt={candidate.fullName}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                                if (sibling) sibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-gray-200 ${
                            candidate.profilePictureUrl ? 'hidden' : ''
                          }`}>
                            <span className="text-white font-bold text-lg">
                              {candidate.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="text-lg font-semibold text-gray-900">
                                  {candidate.fullName}
                                </h5>
                                <p className="text-sm text-gray-600 flex items-center mt-1">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {candidate.email}
                                </p>
                                {candidate.headline && (
                                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {candidate.headline}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                {addingCandidate ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <svg className="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adicionando...
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Adicionar
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {candidateSearchQuery.length >= 2 && candidateSearchResults.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum candidato encontrado</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Tente buscar com outros termos ou verifique se o candidato está cadastrado no sistema.
                  </p>
                </div>
              )}

              {/* Empty State */}
              {candidateSearchQuery.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-500">
                    Comece digitando para buscar candidatos
                  </h3>
                  <p className="mt-2 text-sm text-gray-400">
                    Digite o nome ou email do candidato que deseja adicionar à vaga.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddCandidateForm(false);
                  setCandidateSearchQuery('');
                  setCandidateSearchResults([]);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Shortlist modal */}
      {showCreateShortlistModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Criar Shortlist ({selectedCandidatesForShortlist.length} candidatos)
              </h3>

              {/* Selected candidates preview */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidatos Selecionados
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {jobDetail.applications
                    .filter(app => selectedCandidatesForShortlist.includes(app.candidateId))
                    .map((app) => (
                      <div key={app.candidateId} className="flex items-center py-1">
                        <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                          <span className="text-xs text-gray-600 font-medium">
                            {app.candidateName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900">{app.candidateName}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto de Apresentação
                </label>
                <textarea
                  value={shortlistForm.presentationText}
                  onChange={(e) => setShortlistForm({...shortlistForm, presentationText: e.target.value})}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Como você apresentaria estes candidatos ao cliente?"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações Internas
                </label>
                <textarea
                  value={shortlistForm.notes}
                  onChange={(e) => setShortlistForm({...shortlistForm, notes: e.target.value})}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Anotações para uso interno..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateShortlistModal(false);
                    setShortlistForm({ notes: '', presentationText: '' });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateShortlist}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Criar Shortlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}