/**
 * Formulários guardam campos opcionais vazios como "". O backend valida formato (CNPJ, CEP...) e
 * recusa string vazia, então o payload troca "" (ou só espaços) por null antes de enviar.
 */
export function blankStringsToNull<T extends object>(data: T): T {
  const entries = Object.entries(data).map(([key, value]) => [
    key,
    typeof value === 'string' && value.trim() === '' ? null : value,
  ]);
  return Object.fromEntries(entries) as T;
}
