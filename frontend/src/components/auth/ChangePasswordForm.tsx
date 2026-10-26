import { useState } from "react";
import { Button } from "../ui";
import { useAuth } from "../../context/AuthContext";
import { AuthApiError } from "../../services/authApi";
import { MIN_PASSWORD_LENGTH } from "../../utils/passwordPolicy";
import PasswordInput from "./PasswordInput";
import FormAlert from "./FormAlert";

interface ChangePasswordFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

/** Senha atual + nova + confirmação. Usado na tela obrigatória e no modal do menu do usuário. */
export default function ChangePasswordForm({ onSuccess, onCancel }: ChangePasswordFormProps) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = next.length > 0 && next.length < MIN_PASSWORD_LENGTH;
  const sameAsCurrent = next.length > 0 && next === current;
  const mismatch = confirm.length > 0 && confirm !== next;
  const invalid = !current || next.length < MIN_PASSWORD_LENGTH || sameAsCurrent || next !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) return;
    setError(null);
    setSubmitting(true);
    try {
      await changePassword(current, next);
      onSuccess();
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : "Não foi possível alterar a senha.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-5">
        {error && <FormAlert variant="error">{error}</FormAlert>}
        <PasswordInput
          id="current-password"
          label="Senha atual"
          value={current}
          onChange={setCurrent}
          autoComplete="current-password"
        />
        <PasswordInput
          id="new-password"
          label="Nova senha"
          value={next}
          onChange={setNext}
          placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          error={
            tooShort
              ? `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`
              : sameAsCurrent
                ? "A nova senha deve ser diferente da atual"
                : undefined
          }
        />
        <PasswordInput
          id="confirm-new-password"
          label="Confirmar nova senha"
          value={confirm}
          onChange={setConfirm}
          placeholder="Repita a nova senha"
          autoComplete="new-password"
          error={mismatch ? "As senhas não conferem" : undefined}
        />
        <div className="flex items-center justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" variant="primary" loading={submitting} disabled={invalid}>
            Alterar senha
          </Button>
        </div>
      </div>
    </form>
  );
}
