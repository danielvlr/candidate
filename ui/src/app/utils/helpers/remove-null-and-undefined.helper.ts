/**
  * Remove todas as propriedades `null` ou `undefined` de um objeto.
  *
  * @template T - O tipo do objeto de entrada.
  * @param {T} obj - O objeto do qual as propriedades `null` ou `undefined` serão removidas.
  * @returns {Partial<T>} Um novo objeto sem as propriedades `null` ou `undefined`.
  **/
export function removeNullAndUndefined<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};

  for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (value !== null && value !== undefined) {
              result[key] = value;
          }
      }
  }

  return result;
}
