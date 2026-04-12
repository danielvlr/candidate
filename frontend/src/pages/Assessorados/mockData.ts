import { AssessoradoPhase, AssessoradoStatus } from '../../types/api';

export const PHASE_LABELS: Record<AssessoradoPhase, string> = {
  [AssessoradoPhase.ONBOARDING]: 'Onboarding',
  [AssessoradoPhase.ACTIVE_SEARCH]: 'Busca Ativa',
  [AssessoradoPhase.INTERVIEW_PREP]: 'Prep. Entrevista',
  [AssessoradoPhase.NEGOTIATION]: 'Negociação',
  [AssessoradoPhase.PLACED]: 'Colocado',
  [AssessoradoPhase.COMPLETED]: 'Concluído',
};

export const PHASE_ORDER: AssessoradoPhase[] = [
  AssessoradoPhase.ONBOARDING,
  AssessoradoPhase.ACTIVE_SEARCH,
  AssessoradoPhase.INTERVIEW_PREP,
  AssessoradoPhase.NEGOTIATION,
  AssessoradoPhase.PLACED,
  AssessoradoPhase.COMPLETED,
];

export const PHASE_COLORS: Record<AssessoradoPhase, { bg: string; border: string; text: string; dot: string }> = {
  [AssessoradoPhase.ONBOARDING]: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  [AssessoradoPhase.ACTIVE_SEARCH]: { bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  [AssessoradoPhase.INTERVIEW_PREP]: { bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  [AssessoradoPhase.NEGOTIATION]: { bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/30', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  [AssessoradoPhase.PLACED]: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  [AssessoradoPhase.COMPLETED]: { bg: 'bg-gray-50 dark:bg-gray-500/10', border: 'border-gray-200 dark:border-gray-500/30', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-500' },
};

export const STATUS_LABELS: Record<AssessoradoStatus, string> = {
  [AssessoradoStatus.ACTIVE]: 'Ativo',
  [AssessoradoStatus.PAUSED]: 'Pausado',
  [AssessoradoStatus.COMPLETED]: 'Concluído',
  [AssessoradoStatus.CANCELLED]: 'Cancelado',
};

export const STATUS_BADGE: Record<AssessoradoStatus, 'active' | 'paused' | 'hired' | 'inactive'> = {
  [AssessoradoStatus.ACTIVE]: 'active',
  [AssessoradoStatus.PAUSED]: 'paused',
  [AssessoradoStatus.COMPLETED]: 'hired',
  [AssessoradoStatus.CANCELLED]: 'inactive',
};
