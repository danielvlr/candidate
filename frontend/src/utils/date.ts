// Datas puras do backend (LocalDate, "YYYY-MM-DD") não têm fuso. `new Date('YYYY-MM-DD')` as lê
// como UTC meia-noite e, em America/Sao_Paulo, a exibição volta um dia. Aqui só se reordenam os campos.

const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-10-23" -> "23/10/2026", sem conversão de fuso. Valor vazio ou inválido vira "—". */
export function formatLocalDate(value?: string | null): string {
  if (!value) return '—';
  const match = LOCAL_DATE.exec(value);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  // Data com hora (LocalDateTime/Instant): a conversão local é a esperada.
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('pt-BR');
}
