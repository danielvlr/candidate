import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import type { HeadhunterDTO } from '../../types/api';
import { Input, Textarea, Select, Button, Card, CardBody, useToast } from '../../components/ui';
import { getErrorMessage } from '../../services/apiError';
import { useHeadhunterFilter } from '../../context/HeadhunterFilterContext';

interface HeadhunterFormProps {
  mode: 'create' | 'edit';
}

interface HeadhunterFormState {
  fullName: string;
  email: string;
  phone: string;
  seniority: string;
  fixedCost: string;
  variableCost: string;
  responsibleAreas: string;
}

const SENIORITY_OPTIONS = [
  { value: 'JUNIOR', label: 'Júnior' },
  { value: 'PLENO', label: 'Pleno' },
  { value: 'SENIOR', label: 'Sênior' },
  { value: 'ESPECIALISTA', label: 'Especialista' },
];

const EMPTY_FORM: HeadhunterFormState = {
  fullName: '',
  email: '',
  phone: '',
  seniority: 'PLENO',
  fixedCost: '0',
  variableCost: '0',
  responsibleAreas: '',
};

const toFormState = (hh: HeadhunterDTO): HeadhunterFormState => ({
  fullName: hh.fullName,
  email: hh.email,
  phone: hh.phone ?? '',
  seniority: hh.seniority ?? 'PLENO',
  fixedCost: String(hh.fixedCost ?? 0),
  variableCost: String(hh.variableCost ?? 0),
  responsibleAreas: hh.responsibleAreas ?? '',
});

const toPayload = (form: HeadhunterFormState): HeadhunterDTO => {
  const phoneDigits = form.phone.replace(/\D/g, '');
  return {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    phone: phoneDigits || undefined,
    seniority: form.seniority,
    fixedCost: Number(form.fixedCost),
    variableCost: Number(form.variableCost),
    responsibleAreas: form.responsibleAreas.trim() || undefined,
  };
};

const validate = (form: HeadhunterFormState): string | null => {
  const phoneDigits = form.phone.replace(/\D/g, '');
  if (phoneDigits && !/^\d{10,11}$/.test(phoneDigits)) return 'Telefone deve ter 10 ou 11 dígitos.';
  const variable = Number(form.variableCost);
  if (Number.isNaN(variable) || variable < 0 || variable > 100) {
    return 'Custo variável deve estar entre 0 e 100.';
  }
  if (Number.isNaN(Number(form.fixedCost)) || Number(form.fixedCost) < 0) {
    return 'Custo fixo deve ser positivo.';
  }
  return null;
};

const HeadhunterForm: React.FC<HeadhunterFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const { refresh: refreshHeadhunters } = useHeadhunterFilter();
  const [formData, setFormData] = useState<HeadhunterFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    apiService
      .getHeadhunterById(Number(id))
      .then((hh) => setFormData(toFormState(hh)))
      .catch(() => setError('Erro ao carregar headhunter'))
      .finally(() => setLoading(false));
  }, [mode, id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate(formData);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(formData);
      if (mode === 'create') {
        await apiService.createHeadhunter(payload);
        addToast({ type: 'success', title: 'Headhunter criado com sucesso' });
      } else if (id) {
        await apiService.updateHeadhunter(Number(id), payload);
        addToast({ type: 'success', title: 'Headhunter atualizado com sucesso' });
      }
      await refreshHeadhunters();
      navigate('/headhunters');
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar headhunter'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
              onClick={() => navigate('/headhunters')}
              aria-label="Voltar"
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Novo Headhunter' : 'Editar Headhunter'}
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 ml-10">
            {mode === 'create'
              ? 'Cadastre um novo headhunter no sistema.'
              : 'Edite as informações do headhunter.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Dados do Headhunter</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Nome completo"
                    required
                    type="text"
                    name="fullName"
                    maxLength={100}
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Ex: Maria Silva"
                  />
                </div>
                <Input
                  label="E-mail"
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Ex: maria@empresa.com"
                />
                <Input
                  label="Telefone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ex: 11999998888"
                />
                <Select
                  label="Senioridade"
                  name="seniority"
                  value={formData.seniority}
                  onChange={handleChange}
                  options={SENIORITY_OPTIONS}
                />
                <Input
                  label="Custo fixo (R$)"
                  required
                  type="number"
                  name="fixedCost"
                  min={0}
                  step="0.01"
                  value={formData.fixedCost}
                  onChange={handleChange}
                />
                <Input
                  label="Custo variável (%)"
                  required
                  type="number"
                  name="variableCost"
                  min={0}
                  max={100}
                  step="0.01"
                  value={formData.variableCost}
                  onChange={handleChange}
                />
                <div className="md:col-span-2">
                  <Textarea
                    label="Áreas de atuação"
                    name="responsibleAreas"
                    maxLength={500}
                    value={formData.responsibleAreas}
                    onChange={handleChange}
                    placeholder="Ex: Tecnologia, Finanças"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/headhunters')}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Salvando...' : mode === 'create' ? 'Criar Headhunter' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HeadhunterForm;
