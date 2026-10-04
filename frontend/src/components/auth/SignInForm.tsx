import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Input, Button } from "../ui";
import { useAuth } from "../../context/AuthContext";
import { AuthApiError } from "../../services/authApi";
import PasswordInput from "./PasswordInput";
import FormAlert from "./FormAlert";

interface LocationState {
  from?: { pathname: string; search?: string };
}

export default function SignInForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as LocationState | null)?.from;
  const redirectTo = from ? `${from.pathname}${from.search ?? ""}` : "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password, rememberMe);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setLoginError(err instanceof AuthApiError ? err.message : "Não foi possível entrar. Tente novamente.");
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Entrar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Entre com seu email e senha
          </p>
        </div>
        <form onSubmit={handleSubmit} noValidate={false}>
          <div className="space-y-6">
            {loginError && <FormAlert variant="error">{loginError}</FormAlert>}
            <Input
              label="Email"
              required
              type="email"
              name="email"
              autoComplete="username"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <PasswordInput
              id="password"
              label="Senha"
              value={password}
              onChange={setPassword}
              placeholder="Digite sua senha"
              autoComplete="current-password"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="keep-logged-in"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-white/5"
                />
                <label
                  htmlFor="keep-logged-in"
                  className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400 cursor-pointer"
                >
                  Manter conectado
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>
              Entrar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
