import { useState } from "react";
import { EyeCloseIcon, EyeIcon } from "../../icons";

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  error?: string;
}

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  error,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        <span className="ml-0.5 text-error-500">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          required
          aria-invalid={Boolean(error)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-11 text-sm text-gray-800 placeholder:text-gray-400 transition-colors duration-200 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-700"
        />
        <button
          type="button"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          {visible ? (
            <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
          ) : (
            <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
          )}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-error-500">{error}</p>}
    </div>
  );
}
