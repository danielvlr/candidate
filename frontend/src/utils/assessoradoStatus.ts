// Rótulos pt-BR para fases e status de assessorado vindos do backend (ONBOARDING, PAUSED...).
// Equivalente de utils/jobStatus.ts, usado para traduzir os textos do histórico.

export const ASSESSORADO_CODE_LABELS: Readonly<Record<string, string>> = {
  // Fases
  ONBOARDING: 'Onboarding',
  ACTIVE_SEARCH: 'Busca Ativa',
  INTERVIEW_PREP: 'Prep. Entrevista',
  NEGOTIATION: 'Negociação',
  PLACED: 'Colocado',
  COMPLETED: 'Concluído',
  // Status
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  CANCELLED: 'Cancelado',
};

const CODE_TOKEN = new RegExp(`\\b(${Object.keys(ASSESSORADO_CODE_LABELS).join('|')})\\b`, 'g');

/** Rótulo pt-BR do código; devolve o próprio valor se for desconhecido. */
export function assessoradoCodeLabel(code: string): string {
  return ASSESSORADO_CODE_LABELS[code] ?? code;
}

/**
 * Troca os códigos em textos do histórico
 * ("Status alterado de PAUSED para ACTIVE" → "Status alterado de Pausado para Ativo").
 */
export function translateAssessoradoText(text: string): string {
  return text.replace(CODE_TOKEN, (token) => assessoradoCodeLabel(token));
}
