// Rótulos de prazo por extenso ("há 90 dias" em vez de "90d").

const MS_PER_DAY = 86_400_000;

export function pluralDays(n: number): string {
  return `${n} dia${Math.abs(n) === 1 ? '' : 's'}`;
}

/** Dias inteiros decorridos desde a data ISO; null se ausente ou inválida. */
export function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.floor((Date.now() - time) / MS_PER_DAY));
}

/** "hoje", "há 1 dia", "há 90 dias"; vazio se a data for inválida. */
export function formatDaysAgo(iso?: string | null): string {
  const days = daysSince(iso);
  if (days === null) return '';
  return days === 0 ? 'hoje' : `há ${pluralDays(days)}`;
}
