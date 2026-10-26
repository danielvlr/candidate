import { useEffect, useState } from "react";
import { Modal } from "../ui";
import { MIN_PASSWORD_LENGTH } from "../../utils/passwordPolicy";
import PasswordInput from "./PasswordInput";
import FormAlert from "./FormAlert";

interface SetPasswordModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  /** Define a senha; rejeitar a promise mantém o modal aberto exibindo o erro. */
  onSubmit: (newPassword: string) => Promise<void>;
}

/** Admin define uma senha (nova + confirmação) para outro usuário/headhunter. */
export default function SetPasswordModal({
  isOpen,
  title,
  description,
  confirmLabel,
  onClose,
  onSubmit,
}: SetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPassword("");
      setConfirm("");
      setError(null);
    }
  }, [isOpen]);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;
  const invalid = password.length < MIN_PASSWORD_LENGTH || password !== confirm;

  async function handleConfirm() {
    if (invalid) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível definir a senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      onConfirm={handleConfirm}
      loading={saving}
    >
      <div className="space-y-4">
        {error && <FormAlert variant="error">{error}</FormAlert>}
        <PasswordInput
          id="admin-new-password"
          label="Nova senha"
          value={password}
          onChange={setPassword}
          placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
          autoComplete="new-password"
          error={tooShort ? `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` : undefined}
        />
        <PasswordInput
          id="admin-confirm-password"
          label="Confirmar senha"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          error={mismatch ? "As senhas não conferem" : undefined}
        />
      </div>
    </Modal>
  );
}
