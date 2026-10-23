// Rótulos pt-BR para os status de vaga vindos do backend (ACTIVE, PAUSED...).

export const JOB_STATUS_LABELS: Readonly<Record<string, string>> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  CLOSED: 'Fechada',
  EXPIRED: 'Expirada',
  DRAFT: 'Rascunho',
};

const STATUS_TOKEN = new RegExp(`\\b(${Object.keys(JOB_STATUS_LABELS).join('|')})\\b`, 'g');

/** Rótulo pt-BR do status; devolve o próprio valor se for desconhecido. */
export function jobStatusLabel(status: string): string {
  return JOB_STATUS_LABELS[status] ?? status;
}

/**
 * Troca os códigos de status em textos do histórico
 * ("Status alterado de ACTIVE para CLOSED" → "Status alterado de Ativa para Fechada").
 */
export function translateJobStatusText(text: string): string {
  return text.replace(STATUS_TOKEN, (token) => jobStatusLabel(token));
}
