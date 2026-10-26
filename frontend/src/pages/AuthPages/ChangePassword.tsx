import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ChangePasswordForm from "../../components/auth/ChangePasswordForm";
import { useAuth } from "../../context/AuthContext";

/** Troca obrigatória: fora do layout principal; só sai daqui trocando a senha ou saindo da conta. */
export default function ChangePassword() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/signin", { replace: true });
  }

  return (
    <>
      <PageMeta
        title="Camarmo - Defina sua nova senha"
        description="Camarmo - Sistema de Gestão de Talentos"
      />
      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Defina sua nova senha
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sua senha foi definida por um administrador. Informe a senha recebida e escolha uma nova para continuar.
              </p>
            </div>
            <ChangePasswordForm onSuccess={() => navigate("/", { replace: true })} />
            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 self-start text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Sair
            </button>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
