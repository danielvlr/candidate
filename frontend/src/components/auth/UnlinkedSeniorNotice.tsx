import { useAuth } from "../../context/AuthContext";

const UNLINKED_SENIOR_MESSAGE =
  "Seu usuário ainda não está vinculado a um senior; peça ao administrador";

/** True quando o usuário logado é CPARTNER e ainda não tem senior vinculado. */
function useIsUnlinkedCpartner(): boolean {
  const { user } = useAuth();
  return user?.role === "CPARTNER" && user.headhunterId == null;
}

/** Aviso exibido ao CPARTNER sem vínculo: sem senior, não há assessorados para mostrar. */
export default function UnlinkedSeniorNotice() {
  if (!useIsUnlinkedCpartner()) {
    return null;
  }
  return (
    <div
      role="status"
      className="mb-6 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-800 dark:bg-warning-900/20 dark:text-warning-400"
    >
      {UNLINKED_SENIOR_MESSAGE}
    </div>
  );
}
