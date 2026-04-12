import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  icon,
  required,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || props.name;
  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="ml-0.5 text-error-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-colors duration-200 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-700 ${
            error
              ? 'border-error-300 focus:border-error-300 focus:ring-error-500/10'
              : 'border-gray-300'
          } ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-error-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const Textarea: React.FC<TextareaProps> = ({
  label,
  helperText,
  error,
  required,
  className = '',
  id,
  ...props
}) => {
  const textareaId = id || props.name;
  return (
    <div>
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="ml-0.5 text-error-500">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-colors duration-200 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-700 ${
          error
            ? 'border-error-300 focus:border-error-300 focus:ring-error-500/10'
            : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-error-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export const Select: React.FC<SelectProps> = ({
  label,
  helperText,
  error,
  required,
  options,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || props.name;
  return (
    <div>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="ml-0.5 text-error-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-gray-800 transition-colors duration-200 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-white/[0.03] dark:text-white/90 dark:focus:border-brand-700 ${
          error
            ? 'border-error-300 focus:border-error-300 focus:ring-error-500/10'
            : 'border-gray-300'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-xs text-error-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};
