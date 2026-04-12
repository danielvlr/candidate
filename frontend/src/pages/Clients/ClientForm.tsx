import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { ClientDTO, ClientStatus, ClientType } from '../../types/api';
import { Input, Textarea, Select, Button, Card, CardBody } from '../../components/ui';

interface ClientFormProps {
  mode: 'create' | 'edit';
}

const ClientForm: React.FC<ClientFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState<ClientDTO>({
    companyName: '',
    cnpj: '',
    industry: '',
    companySize: '',
    type: ClientType.SME,
    website: '',
    linkedinUrl: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil',
    contactPersonName: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
    notes: '',
    status: ClientStatus.ACTIVE,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && id) {
      loadClient(parseInt(id));
    }
  }, [mode, id]);

  const loadClient = async (clientId: number) => {
    try {
      setLoading(true);
      const client = await apiService.getClientById(clientId);
      setFormData(client);
    } catch (err) {
      setError('Erro ao carregar empresa');
      console.error('Error loading client:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (mode === 'create') {
        await apiService.createClient(formData);
        setSuccessMessage('Empresa criada com sucesso!');
      } else if (id) {
        await apiService.updateClient(parseInt(id), formData);
        setSuccessMessage('Empresa atualizada com sucesso!');
      }

      navigate('/clients');
    } catch (err) {
      setError(mode === 'create' ? 'Erro ao criar empresa' : 'Erro ao atualizar empresa');
      console.error('Error saving client:', err);
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
          <div className="flex items-center gap-4 mb-2">
            <button
              type="button"
              onClick={() => navigate('/clients')}
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Nova Empresa' : 'Editar Empresa'}
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-10">
            {mode === 'create'
              ? 'Adicione uma nova empresa cliente ao sistema.'
              : 'Edite as informações da empresa.'}
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
          {/* Informacoes da Empresa */}
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Informacoes da Empresa
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Nome da Empresa"
                    required
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Ex: Tech Solutions Ltda"
                  />
                </div>

                <Input
                  label="CNPJ"
                  type="text"
                  name="cnpj"
                  value={formData.cnpj || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: 00.000.000/0001-00"
                />

                <Input
                  label="Setor / Industria"
                  type="text"
                  name="industry"
                  value={formData.industry || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: Tecnologia da Informacao"
                />

                <Input
                  label="Porte da Empresa"
                  type="text"
                  name="companySize"
                  value={formData.companySize || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: 100-500 funcionarios"
                />

                <Select
                  label="Tipo de Empresa"
                  name="type"
                  value={formData.type || ClientType.SME}
                  onChange={handleInputChange}
                  options={[
                    { value: ClientType.STARTUP, label: 'Startup' },
                    { value: ClientType.SME, label: 'PME (Pequena/Media Empresa)' },
                    { value: ClientType.ENTERPRISE, label: 'Enterprise (Grande Empresa)' },
                    { value: ClientType.MULTINATIONAL, label: 'Multinacional' },
                    { value: ClientType.GOVERNMENT, label: 'Governo / Setor Publico' },
                    { value: ClientType.NGO, label: 'ONG / Terceiro Setor' },
                    { value: ClientType.CONSULTING, label: 'Consultoria' },
                  ]}
                />

                <Input
                  label="Website"
                  type="url"
                  name="website"
                  value={formData.website || ''}
                  onChange={handleInputChange}
                  placeholder="https://www.empresa.com.br"
                />

                <Input
                  label="LinkedIn"
                  type="url"
                  name="linkedinUrl"
                  value={formData.linkedinUrl || ''}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/company/empresa"
                />

                <Select
                  label="Status"
                  name="status"
                  value={formData.status || ClientStatus.ACTIVE}
                  onChange={handleInputChange}
                  options={[
                    { value: ClientStatus.ACTIVE, label: 'Ativa' },
                    { value: ClientStatus.INACTIVE, label: 'Inativa' },
                    { value: ClientStatus.SUSPENDED, label: 'Suspensa' },
                    { value: ClientStatus.PROSPECT, label: 'Prospect' },
                  ]}
                />
              </div>
            </CardBody>
          </Card>

          {/* Endereco */}
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Endereco
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Endereco"
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    placeholder="Ex: Av. Paulista, 1000"
                  />
                </div>

                <Input
                  label="Cidade"
                  type="text"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: Sao Paulo"
                />

                <Input
                  label="Estado"
                  type="text"
                  name="state"
                  value={formData.state || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: SP"
                />

                <Input
                  label="CEP"
                  type="text"
                  name="zipCode"
                  value={formData.zipCode || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: 01310-100"
                />

                <Input
                  label="Pais"
                  type="text"
                  name="country"
                  value={formData.country || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: Brasil"
                />
              </div>
            </CardBody>
          </Card>

          {/* Contato Principal */}
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Contato Principal
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Nome do Contato"
                    required
                    type="text"
                    name="contactPersonName"
                    value={formData.contactPersonName || ''}
                    onChange={handleInputChange}
                    placeholder="Ex: Joao Silva"
                  />
                </div>

                <Input
                  label="Email do Contato"
                  required
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: joao.silva@empresa.com.br"
                />

                <Input
                  label="Telefone do Contato"
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: (11) 99999-9999"
                />
              </div>
            </CardBody>
          </Card>

          {/* Descricao */}
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Descricao
              </h3>

              <div className="space-y-6">
                <Textarea
                  label="Descricao da Empresa"
                  name="description"
                  rows={4}
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  placeholder="Descreva a empresa, sua area de atuacao, cultura e diferenciais..."
                />

                <Textarea
                  label="Notas Internas"
                  name="notes"
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  placeholder="Anotacoes internas sobre o relacionamento com esta empresa..."
                />
              </div>
            </CardBody>
          </Card>

          {/* Form Actions - sticky footer */}
          <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 px-6 -mx-6 -mb-6 rounded-b-xl flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/clients')}
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
                ? 'Criar Empresa'
                : 'Salvar Alteracoes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
