import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  HEADHUNTER: "Headhunter",
  CPARTNER: "CPartner",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function UserDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  if (!user) return null;

  function handleLogout() {
    setIsOpen(false);
    logout();
    navigate("/signin", { replace: true });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-2 text-gray-700 dark:text-gray-400"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
          {initials(user.fullName) || "?"}
        </span>
        <span className="hidden max-w-[140px] truncate text-theme-sm font-medium sm:block">
          {user.fullName}
        </span>
        <svg
          className={`h-4 w-4 stroke-gray-500 transition-transform dark:stroke-gray-400 ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 18 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4.3125 8.65625L9 13.3437L13.6875 8.65625" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-3 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="border-b border-gray-200 px-2 pb-3 dark:border-gray-800">
            <p className="truncate text-theme-sm font-medium text-gray-700 dark:text-gray-300">{user.fullName}</p>
            <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            <p className="mt-1 text-theme-xs text-brand-500">{ROLE_LABEL[user.role] ?? user.role}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
