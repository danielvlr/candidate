import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { apiService } from '../../services/api';
import { JobDTO, JobType, WorkMode, ExperienceLevel, JobStatus, ClientDTO, ClientSummaryDTO, ClientType } from '../../types/api';
import { Input, Textarea, Select, Button, Card, CardBody } from '../../components/ui';

const JobCreateForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobDTO>({
    title: '',
    description: '',
    companyName: '',
    clientId: undefined,
    location: '',
    jobType: JobType.FULL_TIME,
    workMode: WorkMode.ONSITE,
    experienceLevel: ExperienceLevel.MID,
    status: JobStatus.DRAFT,
    featured: false,
    urgent: false,
  });

  // Company selector state
  const [companySearch, setCompanySearch] = useState('');
  const [allCompanies, setAllCompanies] = useState<ClientSummaryDTO[]>([]);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<ClientSummaryDTO | null>(null);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Quick-create company modal
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);
  const [quickCreateData, setQuickCreateData] = useState({
    companyName: '',
    contactPersonName: '',
    contactEmail: '',
    industry: '',
    city: '',
    state: '',
    type: '' as string,
  });

  const handleQuickCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setQuickCreateData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleQuickCreateSubmit = async () => {
    if (!quickCreateData.companyName || !quickCreateData.contactPersonName || !quickCreateData.contactEmail) return;
    try {
      setQuickCreateLoading(true);
      const clientPayload: ClientDTO = {
        companyName: quickCreateData.companyName,
        contactPersonName: quickCreateData.contactPersonName,
        contactEmail: quickCreateData.contactEmail,
        industry: quickCreateData.industry || undefined,
        city: quickCreateData.city || undefined,
        state: quickCreateData.state || undefined,
        type: (quickCreateData.type as ClientType) || undefined,
      };
      const created = await apiService.createClient(clientPayload);
      // Auto-select the new company and add to list
      const summary: ClientSummaryDTO = {
        id: created.id!,
        companyName: created.companyName,
        contactEmail: created.contactEmail,
        city: created.city,
        state: created.state,
        industry: created.industry,
      };
      setAllCompanies((prev) => [...prev, summary]);
      handleSelectCompany(summary);
      setShowQuickCreate(false);
      setQuickCreateData({ companyName: '', contactPersonName: '', contactEmail: '', industry: '', city: '', state: '', type: '' });
    } catch {
      setError('Erro ao criar empresa. Verifique os dados.');
    } finally {
      setQuickCreateLoading(false);
    }
  };

  const openQuickCreate = () => {
    setCompanyDropdownOpen(false);
    setQuickCreateData((prev) => ({ ...prev, companyName: companySearch }));
    setShowQuickCreate(true);
  };

  // Load all active companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setCompaniesLoading(true);
        const result = await apiService.getActiveClients();
        setAllCompanies(result.map((c) => ({
          id: c.id!,
          companyName: c.companyName,
          contactEmail: c.contactEmail,
          city: c.city,
          state: c.state,
          industry: c.industry,
        })));
      } catch {
        setAllCompanies([]);
      } finally {
        setCompaniesLoading(false);
      }
    };
    loadCompanies();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) {
        setCompanyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter companies locally
  const filteredCompanies = companySearch.trim()
    ? allCompanies.filter((c) =>
        c.companyName.toLowerCase().includes(companySearch.toLowerCase())
      )
    : allCompanies;

  const handleSelectCompany = (company: ClientSummaryDTO) => {
    setSelectedCompany(company);
    setCompanySearch(company.companyName);
    setCompanyDropdownOpen(false);
    setFormData((prev) => ({
      ...prev,
      companyName: company.companyName,
      clientId: company.id,
    }));
  };

  const handleCompanySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCompanySearch(value);
    if (selectedCompany) {
      setSelectedCompany(null);
      setFormData((prev) => ({
        ...prev,
        companyName: '',
        clientId: undefined,
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? Number(value) : undefined
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();

    if (!formData.clientId) {
      setError('Selecione uma empresa cadastrada para a vaga.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const jobData = {
        ...formData,
        status: publish ? JobStatus.ACTIVE : JobStatus.DRAFT
      };

      await apiService.createJob(jobData);
      navigate('/jobs');
    } catch (err) {
      setError('Erro ao criar vaga. Tente novamente.');
      console.error('Error creating job:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/jobs')}
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Criar Nova Vaga</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
            {error}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardBody>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Informacoes Basicas</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Titulo da Vaga"
                    required
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Ex: Desenvolvedor Frontend React"
                  />
                </div>

                {/* Company Selector */}
                <div className="relative" ref={companyDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Empresa
                    <span className="ml-1 text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={companySearch}
                      onChange={handleCompanySearchChange}
                      onFocus={() => {
                        if (!selectedCompany) {
                          setCompanyDropdownOpen(true);
                        }
                      }}
                      placeholder="Selecionar empresa..."
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder-gray-500"
                    />
                    {companiesLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    {selectedCompany && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCompany(null);
                          setCompanySearch('');
                          setFormData((prev) => ({ ...prev, companyName: '', clientId: undefined }));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {selectedCompany && (
                    <p className="mt-1 text-xs text-brand-600 dark:text-brand-400">
                      Empresa vinculada: {selectedCompany.companyName}
                      {selectedCompany.city && ` • ${selectedCompany.city}`}
                      {selectedCompany.industry && ` • ${selectedCompany.industry}`}
                    </p>
                  )}
                  {!selectedCompany && !companyDropdownOpen && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Clique para selecionar uma empresa ou cadastrar uma nova
                    </p>
                  )}
                  {companyDropdownOpen && !selectedCompany && (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 max-h-72 overflow-y-auto">
                      {filteredCompanies.map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => handleSelectCompany(company)}
                          className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {company.companyName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {[company.industry, company.city, company.state]
                                .filter(Boolean)
                                .join(' • ')}
                            </p>
                          </div>
                        </button>
                      ))}
                      {filteredCompanies.length === 0 && (
                        <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          Nenhuma empresa encontrada{companySearch ? ` para "${companySearch}"` : ''}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={openQuickCreate}
                        className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors border-t border-gray-200 dark:border-gray-700"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Cadastrar Nova Empresa
                      </button>
                    </div>
                  )}
                </div>

                <Input
                  label="Localizacao"
                  required
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Ex: Sao Paulo, SP"
                />

                <Select
                  label="Tipo de Contrato"
                  required
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleInputChange}
                  options={[
                    { value: JobType.FULL_TIME, label: 'Tempo Integral' },
                    { value: JobType.PART_TIME, label: 'Meio Periodo' },
                    { value: JobType.CONTRACT, label: 'Contrato' },
                    { value: JobType.INTERNSHIP, label: 'Estagio' },
                    { value: JobType.FREELANCE, label: 'Freelance' },
                  ]}
                />

                <Select
                  label="Modalidade de Trabalho"
                  required
                  name="workMode"
                  value={formData.workMode}
                  onChange={handleInputChange}
                  options={[
                    { value: WorkMode.REMOTE, label: 'Remoto' },
                    { value: WorkMode.ONSITE, label: 'Presencial' },
                    { value: WorkMode.HYBRID, label: 'Hibrido' },
                  ]}
                />

                <Select
                  label="Nivel de Experiencia"
                  required
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                  options={[
                    { value: ExperienceLevel.ENTRY, label: 'Iniciante' },
                    { value: ExperienceLevel.JUNIOR, label: 'Junior' },
                    { value: ExperienceLevel.MID, label: 'Pleno' },
                    { value: ExperienceLevel.SENIOR, label: 'Senior' },
                    { value: ExperienceLevel.LEAD, label: 'Lead/Especialista' },
                  ]}
                />
              </div>

              <div className="mt-6">
                <Textarea
                  label="Descricao da Vaga"
                  required
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Descreva as responsabilidades, requisitos e o que a empresa oferece..."
                />
              </div>
            </CardBody>
          </Card>

          {/* Salary and Benefits */}
          <Card>
            <CardBody>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Remuneracao e Beneficios</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Salario Minimo (R$)"
                  type="number"
                  name="minSalary"
                  value={formData.minSalary || ''}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="Ex: 5000"
                />

                <Input
                  label="Salario Maximo (R$)"
                  type="number"
                  name="maxSalary"
                  value={formData.maxSalary || ''}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="Ex: 8000"
                />

                <div className="md:col-span-2">
                  <Textarea
                    label="Beneficios"
                    name="benefits"
                    value={formData.benefits || ''}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Ex: Vale alimentacao, plano de saude, home office..."
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Skills and Additional Info */}
          <Card>
            <CardBody>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Habilidades e Informacoes Adicionais</h2>

              <div className="space-y-6">
                <Textarea
                  label="Habilidades Requeridas"
                  name="skills"
                  value={formData.skills || ''}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Ex: React, TypeScript, Node.js, PostgreSQL..."
                />

                <Input
                  label="Prazo para Candidatura"
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline || ''}
                  onChange={handleInputChange}
                />

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vaga em Destaque</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="urgent"
                      checked={formData.urgent}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500 dark:border-gray-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vaga Urgente</span>
                  </label>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Actions - sticky footer */}
          <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 px-6 -mx-6 -mb-6 rounded-b-xl flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/jobs')}
              disabled={loading}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Salvando...' : 'Salvar como Rascunho'}
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || !formData.title || !formData.clientId || !formData.location || !formData.description}
              loading={loading}
            >
              {loading ? 'Publicando...' : 'Publicar Vaga'}
            </Button>
          </div>
        </form>

        {/* Quick Create Company Modal */}
        {showQuickCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowQuickCreate(false)} />
            <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-gray-900 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Criar Nova Empresa</h3>
                <button
                  type="button"
                  onClick={() => setShowQuickCreate(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <Input
                  label="Nome da Empresa"
                  required
                  name="companyName"
                  value={quickCreateData.companyName}
                  onChange={handleQuickCreateChange}
                  placeholder="Ex: Tech Solutions Ltda"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Pessoa de Contato"
                    required
                    name="contactPersonName"
                    value={quickCreateData.contactPersonName}
                    onChange={handleQuickCreateChange}
                    placeholder="Ex: Maria Silva"
                  />
                  <Input
                    label="Email de Contato"
                    required
                    type="email"
                    name="contactEmail"
                    value={quickCreateData.contactEmail}
                    onChange={handleQuickCreateChange}
                    placeholder="Ex: rh@empresa.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Setor/Industria"
                    name="industry"
                    value={quickCreateData.industry}
                    onChange={handleQuickCreateChange}
                    placeholder="Ex: Tecnologia"
                  />
                  <Select
                    label="Tipo"
                    name="type"
                    value={quickCreateData.type}
                    onChange={handleQuickCreateChange}
                    options={[
                      { value: '', label: 'Selecione...' },
                      { value: ClientType.STARTUP, label: 'Startup' },
                      { value: ClientType.SME, label: 'PME' },
                      { value: ClientType.ENTERPRISE, label: 'Grande Empresa' },
                      { value: ClientType.MULTINATIONAL, label: 'Multinacional' },
                      { value: ClientType.GOVERNMENT, label: 'Governo' },
                      { value: ClientType.NGO, label: 'ONG' },
                      { value: ClientType.CONSULTING, label: 'Consultoria' },
                    ]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Cidade"
                    name="city"
                    value={quickCreateData.city}
                    onChange={handleQuickCreateChange}
                    placeholder="Ex: Sao Paulo"
                  />
                  <Input
                    label="Estado"
                    name="state"
                    value={quickCreateData.state}
                    onChange={handleQuickCreateChange}
                    placeholder="Ex: SP"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                <Button variant="outline" onClick={() => setShowQuickCreate(false)} disabled={quickCreateLoading}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleQuickCreateSubmit}
                  loading={quickCreateLoading}
                  disabled={quickCreateLoading || !quickCreateData.companyName || !quickCreateData.contactPersonName || !quickCreateData.contactEmail}
                >
                  {quickCreateLoading ? 'Criando...' : 'Criar e Selecionar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobCreateForm;
