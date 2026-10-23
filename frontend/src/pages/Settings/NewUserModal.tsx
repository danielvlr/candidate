import React, { useState } from 'react';
import type { AuthRole } from '../../services/authStorage';
import type { UserCreate } from '../../services/usersApi';
import { Input, Modal, Select } from '../../components/ui';

interface NewUserModalProps {
  isOpen: boolean;
  saving: boolean;
  roleOptions: { value: AuthRole; label: string }[];
  headhunterOptions: { value: string; label: string }[];
  onClose: () => void;
  onSubmit: (user: UserCreate) => void;
}

const MIN_PASSWORD_LENGTH = 8;

interface NewUserForm {
  email: string;
  fullName: string;
  password: string;
  role: AuthRole;
  headhunterId: string;
}

const EMPTY_FORM: NewUserForm = {
  email: '',
  fullName: '',
  password: '',
  role: 'HEADHUNTER',
  headhunterId: '',
};

const validate = (form: NewUserForm): string | null => {
  if (!form.fullName.trim()) return 'Informe o nome.';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Informe um e-mail válido.';
  if (form.password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
};

const NewUserModal: React.FC<NewUserModalProps> = ({
  isOpen,
  saving,
  roleOptions,
  headhunterOptions,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  };

  const handleConfirm = () => {
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onSubmit({
      email: form.email.trim(),
      fullName: form.fullName.trim(),
      password: form.password,
      role: form.role,
      headhunterId:
        (form.role === 'HEADHUNTER' || form.role === 'CPARTNER') && form.headhunterId
          ? Number(form.headhunterId)
          : null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Novo usuário"
      description="Crie um acesso ao sistema e defina o perfil."
      confirmLabel="Criar usuário"
      onConfirm={handleConfirm}
      loading={saving}
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-error-600 dark:text-error-400">{error}</p>}
        <Input
          label="Nome"
          name="fullName"
          required
          value={form.fullName}
          onChange={handleChange}
        />
        <Input
          label="E-mail"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
        />
        <Input
          label="Senha"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          helperText={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres.`}
          value={form.password}
          onChange={handleChange}
        />
        <Select
          label="Perfil"
          name="role"
          options={roleOptions}
          value={form.role}
          onChange={handleChange}
        />
        {(form.role === 'HEADHUNTER' || form.role === 'CPARTNER') && (
          <Select
            label={form.role === 'CPARTNER' ? 'Senior vinculado (opcional)' : 'Headhunter vinculado (opcional)'}
            name="headhunterId"
            options={headhunterOptions}
            value={form.headhunterId}
            onChange={handleChange}
          />
        )}
      </div>
    </Modal>
  );
};

export default NewUserModal;
