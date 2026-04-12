import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Camarmo - Cadastro"
        description="Camarmo - Sistema de Gestão de Talentos"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
