import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Camarmo - Login"
        description="Camarmo - Sistema de Gestão de Talentos"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
