import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { CandidateDTO, CandidateStatus, WorkPreference, ExperienceDTO, EducationDTO } from '../../types/api';
import { Input, Textarea, Select, Button, Card, CardBody } from '../../components/ui';

interface CandidateFormProps {
  mode: 'create' | 'edit';
}

const CandidateForm: React.FC<CandidateFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState<CandidateDTO>({
    fullName: '',
    email: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    headline: '',
    desiredSalary: undefined,
    summary: '',
    skills: '',
    experiences: [],
    education: [],
    status: CandidateStatus.ACTIVE,
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    availabilityDate: '',
    willingToRelocate: false,
    workPreference: WorkPreference.HYBRID,
  });

  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMethod, setImportMethod] = useState<'url' | 'file'>('url');
  const [isLoadingLinkedIn, setIsLoadingLinkedIn] = useState(false);
  const [linkedInError, setLinkedInError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && id) {
      loadCandidate(parseInt(id));
    }
  }, [mode, id]);

  const loadCandidate = async (candidateId: number) => {
    try {
      setLoading(true);
      const candidate = await apiService.getCandidateById(candidateId);
      setFormData({
        ...candidate,
        experiences: candidate.experiences || [],
        education: candidate.education || []
      });
      setLinkedInUrl(candidate.linkedinUrl || '');
    } catch (err) {
      setError('Erro ao carregar candidato');
      console.error('Error loading candidate:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseFloat(value) : undefined
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setLinkedInError('Por favor, selecione apenas arquivos PDF');
        return;
      }
      setSelectedFile(file);
      setLinkedInError(null);
    }
  };

  const addExperience = () => {
    const newExperience: ExperienceDTO = {
      jobTitle: '',
      companyName: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      experiences: [...(prev.experiences || []), newExperience]
    }));
  };

  const removeExperience = (index: number) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences?.filter((_, i) => i !== index) || []
    }));
  };

  const updateExperience = (index: number, field: keyof ExperienceDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences?.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      ) || []
    }));
  };

  const addEducation = () => {
    const newEducation: EducationDTO = {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      education: [...(prev.education || []), newEducation]
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index) || []
    }));
  };

  const updateEducation = (index: number, field: keyof EducationDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education?.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      ) || []
    }));
  };

  const handlePhotoUpload = async (file: File) => {
    if (!id) {
      setError('ID do candidato não encontrado. Salve o candidato primeiro.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/v1/candidates/${id}/photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload da foto');
      }

      const result = await response.json();
      setFormData(prev => ({
        ...prev,
        profilePictureUrl: result.url
      }));

      setPhotoFile(null);
    } catch (err) {
      setError('Erro ao fazer upload da foto');
      console.error('Photo upload error:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Arquivo muito grande. Máximo 5MB.');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de arquivo não permitido. Use JPEG, PNG, GIF ou WebP.');
        return;
      }

      setPhotoFile(file);
      setError(null);
    }
  };

  const handleLinkedInImport = async () => {
    if (importMethod === 'url') {
      if (!linkedInUrl.trim()) {
        setLinkedInError('Por favor, insira uma URL do LinkedIn');
        return;
      }
    } else {
      if (!selectedFile) {
        setLinkedInError('Por favor, selecione um arquivo PDF');
        return;
      }
    }

    try {
      setIsLoadingLinkedIn(true);
      setLinkedInError(null);

      let candidateData;

      if (importMethod === 'url') {
        // Primeiro valida a URL
        const validation = await apiService.validateLinkedInUrl(linkedInUrl);
        if (!validation.valid) {
          setLinkedInError('URL do LinkedIn inválida');
          return;
        }

        // Importa os dados do LinkedIn pela URL
        candidateData = await apiService.importFromLinkedIn(linkedInUrl);
      } else {
        // Importa os dados do PDF enviado
        candidateData = await apiService.importFromLinkedInPdf(selectedFile!);
      }

      // Preenche o formulário com os dados importados
      setFormData(prev => ({
        ...prev,
        ...candidateData,
        experiences: candidateData.experiences || [],
        education: candidateData.education || [],
        id: prev.id, // Mantém o ID se estivermos editando
      }));

      setLinkedInError(null);
    } catch (err) {
      setLinkedInError(`Erro ao importar dados do LinkedIn: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      console.error('Error importing LinkedIn data:', err);
    } finally {
      setIsLoadingLinkedIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (mode === 'create') {
        await apiService.createCandidate(formData);
      } else if (id) {
        await apiService.updateCandidate(parseInt(id), formData);
      }

      navigate('/candidates');
    } catch (err) {
      setError(mode === 'create' ? 'Erro ao criar candidato' : 'Erro ao atualizar candidato');
      console.error('Error saving candidate:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && mode === 'edit') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {mode === 'create' ? 'Novo Candidato' : 'Editar Candidato'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {mode === 'create'
              ? 'Adicione um novo candidato ao sistema. Você pode importar dados do LinkedIn para preencher automaticamente o formulário.'
              : 'Edite as informações do candidato.'
            }
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
            {error}
          </div>
        )}

        {/* LinkedIn Import Section - Only for Create Mode */}
        {mode === 'create' && (
          <Card className="mb-8 border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20">
            <CardBody>
              <h3 className="text-lg font-semibold text-brand-900 dark:text-brand-200 mb-4">
                Importar do LinkedIn
              </h3>

              {/* Import Method Selection */}
              <div className="mb-4">
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="importMethod"
                      value="url"
                      checked={importMethod === 'url'}
                      onChange={(e) => setImportMethod(e.target.value as 'url' | 'file')}
                      className="mr-2 h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">URL do LinkedIn</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="importMethod"
                      value="file"
                      checked={importMethod === 'file'}
                      onChange={(e) => setImportMethod(e.target.value as 'url' | 'file')}
                      className="mr-2 h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload PDF do Currículo</span>
                  </label>
                </div>
              </div>

              {/* URL Import */}
              {importMethod === 'url' && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="url"
                      placeholder="https://linkedin.com/in/usuario"
                      value={linkedInUrl}
                      onChange={(e) => setLinkedInUrl(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleLinkedInImport}
                    disabled={isLoadingLinkedIn}
                    loading={isLoadingLinkedIn}
                  >
                    {isLoadingLinkedIn ? 'Importando...' : 'Importar'}
                  </Button>
                </div>
              )}

              {/* File Upload */}
              {importMethod === 'file' && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleLinkedInImport}
                      disabled={isLoadingLinkedIn || !selectedFile}
                      loading={isLoadingLinkedIn}
                    >
                      {isLoadingLinkedIn ? 'Processando...' : 'Processar PDF'}
                    </Button>
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Arquivo selecionado: {selectedFile.name}
                    </p>
                  )}
                </div>
              )}

              {linkedInError && (
                <p className="mt-2 text-sm text-error-600 dark:text-error-400">{linkedInError}</p>
              )}

              <div className="mt-2 text-sm text-brand-600 dark:text-brand-400">
                {importMethod === 'url' ? (
                  <p>Cole a URL do perfil LinkedIn para preencher automaticamente os dados do candidato.</p>
                ) : (
                  <p>Faça upload do PDF do currículo exportado do LinkedIn para extrair as informações automaticamente.</p>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informações Pessoais</h3>

              {/* Profile Picture Section */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  {formData.profilePictureUrl ? (
                    <div className="relative">
                      <img
                        src={formData.profilePictureUrl}
                        alt={formData.fullName || 'Profile'}
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute -bottom-2 left-0 right-0 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300">
                          Foto
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Upload Section */}
              {mode === 'edit' && id && (
                <div className="mb-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">Upload de Foto</h4>
                  <div className="flex flex-col items-center gap-3">
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Escolher Arquivo
                    </label>

                    {photoFile && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{photoFile.name}</span>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handlePhotoUpload(photoFile)}
                          disabled={isUploadingPhoto}
                          loading={isUploadingPhoto}
                        >
                          {isUploadingPhoto ? 'Enviando...' : 'Upload'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setPhotoFile(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Formatos aceitos: JPEG, PNG, GIF, WebP. Tamanho máximo: 5MB.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nome Completo"
                  required
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />

                <Input
                  label="Email"
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />

                <Input
                  label="Data de Nascimento"
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mt-6">
                <Input
                  label="Endereço"
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <Input
                  label="Cidade"
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleInputChange}
                />

                <Input
                  label="Estado"
                  type="text"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleInputChange}
                />

                <Input
                  label="CEP"
                  type="text"
                  name="zipCode"
                  value={formData.zipCode || ''}
                  onChange={handleInputChange}
                />
              </div>
            </CardBody>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informações Profissionais</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Headline"
                    type="text"
                    name="headline"
                    value={formData.headline || ''}
                    onChange={handleInputChange}
                    placeholder="Ex: Desenvolvedor Full Stack | React & Node.js | 5+ anos de experiência"
                  />
                </div>

                <Input
                  label="Salário Desejado (R$)"
                  type="number"
                  name="desiredSalary"
                  min="0"
                  step="0.01"
                  value={formData.desiredSalary || ''}
                  onChange={handleInputChange}
                />

                <Select
                  label="Modalidade de Trabalho"
                  name="workPreference"
                  value={formData.workPreference}
                  onChange={handleInputChange}
                  options={[
                    { value: WorkPreference.REMOTE, label: 'Remoto' },
                    { value: WorkPreference.ONSITE, label: 'Presencial' },
                    { value: WorkPreference.HYBRID, label: 'Híbrido' },
                  ]}
                />

                <Input
                  label="Data de Disponibilidade"
                  type="date"
                  name="availabilityDate"
                  value={formData.availabilityDate || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="willingToRelocate"
                    checked={formData.willingToRelocate}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Disposto a se mudar</span>
                </label>
              </div>

              <div className="mt-6">
                <Textarea
                  label="Resumo Profissional"
                  name="summary"
                  rows={4}
                  value={formData.summary || ''}
                  onChange={handleInputChange}
                  placeholder="Breve descrição do perfil profissional..."
                />
              </div>

              <div className="mt-6">
                <Textarea
                  label="Habilidades"
                  name="skills"
                  rows={3}
                  value={formData.skills || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: Java, Spring Boot, React, PostgreSQL..."
                />
              </div>

              {/* Experiences Section */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Experiências Profissionais
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addExperience}
                  >
                    + Adicionar Experiência
                  </Button>
                </div>
                {formData.experiences?.map((exp, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Experiência {index + 1}</h4>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeExperience(index)}
                      >
                        Remover
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Cargo"
                        required
                        type="text"
                        value={exp.jobTitle}
                        onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
                        placeholder="Ex: Desenvolvedor Full Stack"
                      />

                      <Input
                        label="Empresa"
                        required
                        type="text"
                        value={exp.companyName}
                        onChange={(e) => updateExperience(index, 'companyName', e.target.value)}
                        placeholder="Ex: Tech Company Ltd."
                      />

                      <Input
                        label="Localização"
                        type="text"
                        value={exp.location || ''}
                        onChange={(e) => updateExperience(index, 'location', e.target.value)}
                        placeholder="Ex: São Paulo, SP"
                      />

                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exp.isCurrent || false}
                            onChange={(e) => updateExperience(index, 'isCurrent', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Trabalho atual</span>
                        </label>
                      </div>

                      <Input
                        label="Data de Início"
                        required
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                      />

                      <Input
                        label="Data de Fim"
                        type="date"
                        value={exp.endDate || ''}
                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                        disabled={exp.isCurrent}
                      />
                    </div>

                    <div className="mt-4">
                      <Textarea
                        label="Descrição"
                        rows={2}
                        value={exp.description || ''}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        placeholder="Descreva as principais responsabilidades e conquistas..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Education Section */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Formação Acadêmica
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addEducation}
                  >
                    + Adicionar Formação
                  </Button>
                </div>
                {formData.education?.map((edu, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Formação {index + 1}</h4>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeEducation(index)}
                      >
                        Remover
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Instituição"
                        required
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                        placeholder="Ex: Universidade de São Paulo"
                      />

                      <Input
                        label="Grau/Tipo"
                        type="text"
                        value={edu.degree || ''}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        placeholder="Ex: Bacharelado, MBA, Certificação"
                      />

                      <Input
                        label="Área de Estudo"
                        type="text"
                        value={edu.fieldOfStudy || ''}
                        onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                        placeholder="Ex: Ciência da Computação"
                      />

                      <Input
                        label="Data de Início"
                        type="date"
                        value={edu.startDate || ''}
                        onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                      />

                      <Input
                        label="Data de Conclusão"
                        type="date"
                        value={edu.endDate || ''}
                        onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                      />
                    </div>

                    <div className="mt-4">
                      <Textarea
                        label="Descrição"
                        rows={2}
                        value={edu.description || ''}
                        onChange={(e) => updateEducation(index, 'description', e.target.value)}
                        placeholder="Descrição adicional, projetos relevantes, etc..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Links and Status */}
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Links e Status</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="LinkedIn URL"
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl || ''}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/usuario"
                />

                <Input
                  label="GitHub URL"
                  type="url"
                  name="githubUrl"
                  value={formData.githubUrl || ''}
                  onChange={handleInputChange}
                  placeholder="https://github.com/usuario"
                />

                <Input
                  label="Portfolio URL"
                  type="url"
                  name="portfolioUrl"
                  value={formData.portfolioUrl || ''}
                  onChange={handleInputChange}
                  placeholder="https://meuportfolio.com"
                />

                <Select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  options={[
                    { value: CandidateStatus.ACTIVE, label: 'Ativo' },
                    { value: CandidateStatus.INACTIVE, label: 'Inativo' },
                    { value: CandidateStatus.HIRED, label: 'Contratado' },
                    { value: CandidateStatus.BLACKLISTED, label: 'Blacklisted' },
                  ]}
                />
              </div>
            </CardBody>
          </Card>

          {/* Form Actions - sticky footer */}
          <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 px-6 -mx-6 -mb-6 rounded-b-xl flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/candidates')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Salvando...' : mode === 'create' ? 'Criar Candidato' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateForm;
