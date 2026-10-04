import { useState } from "react";
import { Link } from "react-router";
import { ChevronLeftIcon } from "../../icons";
import { Input, Button } from "../ui";
import { authApi, AuthApiError } from "../../services/authApi";
import FormAlert from "./FormAlert";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSentMessage(res.message);
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : "Não foi possível enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Voltar ao login
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Esqueceu sua senha?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Informe o email da sua conta e enviaremos um link para você criar uma nova senha.
          </p>
        </div>

        {sentMessage ? (
          <div className="space-y-6">
            <FormAlert variant="success">{sentMessage}</FormAlert>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Não recebeu? Verifique a caixa de spam ou{" "}
              <button
                type="button"
                onClick={() => setSentMessage(null)}
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                tente novamente
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {error && <FormAlert variant="error">{error}</FormAlert>}
              <Input
                label="Email"
                required
                type="email"
                name="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>
                Enviar link de redefinição
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
