import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

export default function ResetPassword() {
  return (
    <>
      <PageMeta
        title="Camarmo - Redefinir senha"
        description="Camarmo - Sistema de Gestão de Talentos"
      />
      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
    </>
  );
}
