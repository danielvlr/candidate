import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";

export default function ForgotPassword() {
  return (
    <>
      <PageMeta
        title="Camarmo - Esqueci minha senha"
        description="Camarmo - Sistema de Gestão de Talentos"
      />
      <AuthLayout>
        <ForgotPasswordForm />
      </AuthLayout>
    </>
  );
}
