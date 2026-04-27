import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { apiService } from '../../services/api';

interface InviteCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // TODO: replace with value from auth context once OAuth2 lands
  headhunterId?: number;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const InviteCandidateModal: React.FC<InviteCandidateModalProps> = ({
  isOpen,
  onClose,
  headhunterId,
}) => {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Resolve headhunter id: prop > localStorage > fallback 1
  const resolvedHeadhunterId =
    headhunterId ??
    Number(localStorage.getItem('headhunter_id') ?? '1') ||
    1; // TODO: pull from auth context when OAuth2 lands

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'E-mail é obrigatório.';
    if (!EMAIL_REGEX.test(value.trim())) return 'E-mail inválido.';
    return '';
  };

  const handleClose = () => {
    setEmail('');
    setFullName('');
    setEmailError('');
    onClose();
  };

  const handleConfirm = async () => {
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }
    setEmailError('');

    try {
      setLoading(true);
      const { status, data } = await apiService.inviteCandidate(
        { email: email.trim(), fullName: fullName.trim() || undefined },
        resolvedHeadhunterId
      );

      if (status === 201) {
        addToast({
          type: 'success',
          title: 'Convite enviado',
          message: `Convite enviado para ${data.email}`,
        });
      } else {
        // 202 EMAIL_FAILED
        addToast({
          type: 'warning',
          title: 'Convite criado, mas e-mail não foi entregue',
          message: `Use "Reenviar" na listagem para ${data.email}`,
        });
      }

      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar convite';
      addToast({ type: 'error', title: 'Erro', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Convidar candidato"
      description="Envie um convite por e-mail para o candidato preencher o próprio cadastro."
      confirmLabel="Enviar convite"
      cancelLabel="Cancelar"
      onConfirm={handleConfirm}
      loading={loading}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            E-mail <span className="text-error-500">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(validateEmail(e.target.value));
            }}
            onBlur={() => setEmailError(validateEmail(email))}
            placeholder="candidato@email.com"
            className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
              emailError
                ? 'border-error-500 dark:border-error-500'
                : 'border-gray-300 dark:border-gray-700'
            }`}
          />
          {emailError && (
            <p className="mt-1 text-xs text-error-600 dark:text-error-400">{emailError}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Nome completo{' '}
            <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nome do candidato"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </Modal>
  );
};

export default InviteCandidateModal;
