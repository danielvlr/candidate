import { useEffect } from "react";
import { useToast } from "../ui";
import ChangePasswordForm from "./ChangePasswordForm";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** "Alterar senha" do menu do usuário (qualquer perfil). */
export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Alterar senha"
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xl dark:border-gray-700 dark:bg-gray-900"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white/90">Alterar senha</h3>
        <ChangePasswordForm
          onCancel={onClose}
          onSuccess={() => {
            addToast({ type: "success", title: "Senha alterada com sucesso" });
            onClose();
          }}
        />
      </div>
    </div>
  );
}
