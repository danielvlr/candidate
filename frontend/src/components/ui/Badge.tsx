import React from 'react';

type BadgeVariant =
  | 'active'
  | 'inactive'
  | 'hired'
  | 'blacklisted'
  | 'paused'
  | 'urgent'
  | 'featured'
  | 'closed'
  | 'expired'
  | 'draft'
  | 'info';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  active:
    'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
  inactive:
    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  hired:
    'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  blacklisted:
    'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
  paused:
    'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
  urgent:
    'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  featured:
    'bg-theme-purple-500/10 text-theme-purple-500 dark:bg-theme-purple-500/15',
  closed:
    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  expired:
    'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400',
  draft:
    'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400',
  info:
    'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400',
};

const dotColors: Record<BadgeVariant, string> = {
  active: 'bg-success-500',
  inactive: 'bg-gray-400',
  hired: 'bg-brand-500',
  blacklisted: 'bg-error-500',
  paused: 'bg-warning-500',
  urgent: 'bg-orange-500',
  featured: 'bg-theme-purple-500',
  closed: 'bg-gray-400',
  expired: 'bg-error-500',
  draft: 'bg-blue-light-500',
  info: 'bg-blue-light-500',
};

export const Badge: React.FC<BadgeProps> = ({
  variant,
  children,
  className = '',
  dot = false,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
};
