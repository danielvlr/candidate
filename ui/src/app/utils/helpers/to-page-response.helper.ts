import { PageResponse } from "../interfaces/page-response.interface";
/**
  * Converte uma resposta genérica em um objeto `PageResponse`.
  *
  * @template T - O tipo dos elementos na página.
  * @param {any} response - A resposta a ser convertida.
  * @returns {PageResponse<T>} Um objeto `PageResponse` contendo o conteúdo da página e metadados.
  *
  * @typedef {Object} PageResponse
  * @property {T[]} content - O conteúdo da página.
  * @property {Object} metadata - Os metadados da página.
  * @property {number} metadata.totalPages - O número total de páginas.
  * @property {number} metadata.totalElements - O número total de elementos.
  * @property {number} metadata.number - O número da página atual.
  **/
export function toPageResponse<T>(response: any): PageResponse<T> {
  return {
    content: response.content,
    metadata: {
      totalPages: response.totalPages,
      totalElements: response.totalElements,
      number: response.size,
    }
  }
}
