import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "../ui";
import { authApi, AuthApiError } from "../../services/authApi";
import PasswordInput from "./PasswordInput";
import FormAlert from "./FormAlert";

const MIN_LENGTH = 8;

type TokenState = "checking" | "valid" | "invalid";

export default function ResetPasswordForm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [tokenState, setTokenState] = useState<TokenState>(token ? "checking" : "invalid");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authApi
      .validateResetToken(token)
      .then((res) => !cancelled && setTokenState(res.valid ? "valid" : "invalid"))
      .catch(() => !cancelled && setTokenState("invalid"));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirm.length > 0 && confirm !== password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_LENGTH || password !== confirm) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await authApi.resetPassword(token, password);
      setDone(res.message);
      setTimeout(() => navigate("/signin", { replace: true }), 2500);
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : "Não foi possível redefinir a senha.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Criar nova senha
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Escolha uma senha com pelo menos {MIN_LENGTH} caracteres.
          </p>
        </div>

        {tokenState === "checking" && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Validando link…</p>
        )}

        {tokenState === "invalid" && (
          <div className="space-y-6">
            <FormAlert variant="error">Este link de redefinição é inválido ou expirou.</FormAlert>
            <Link
              to="/forgot-password"
              className="inline-block text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Solicitar um novo link
            </Link>
          </div>
        )}

        {tokenState === "valid" && done && (
          <FormAlert variant="success">{done} Redirecionando para o login…</FormAlert>
        )}

        {tokenState === "valid" && !done && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {error && <FormAlert variant="error">{error}</FormAlert>}
              <PasswordInput
                id="new-password"
                label="Nova senha"
                value={password}
                onChange={setPassword}
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
                minLength={MIN_LENGTH}
                error={tooShort ? `A senha deve ter pelo menos ${MIN_LENGTH} caracteres` : undefined}
              />
              <PasswordInput
                id="confirm-password"
                label="Confirmar nova senha"
                value={confirm}
                onChange={setConfirm}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                error={mismatch ? "As senhas não conferem" : undefined}
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={submitting}
                disabled={password.length < MIN_LENGTH || password !== confirm}
              >
                Redefinir senha
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
