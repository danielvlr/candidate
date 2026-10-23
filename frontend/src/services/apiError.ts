// Erro tipado para respostas não-2xx do backend (formato do GlobalExceptionHandler:
// { status, error, message, timestamp, fieldErrors? }).

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors;

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface ErrorBody {
  message?: unknown;
  fieldErrors?: unknown;
}

function isStringRecord(value: unknown): value is FieldErrors {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((item) => typeof item === 'string')
  );
}

async function readErrorBody(response: Response): Promise<ErrorBody> {
  try {
    const text = await response.text();
    return text.trim() === '' ? {} : (JSON.parse(text) as ErrorBody);
  } catch {
    return {};
  }
}

/** Lê o corpo de uma resposta de erro e devolve um ApiError com a mensagem real do backend. */
export async function buildApiError(response: Response): Promise<ApiError> {
  const body = await readErrorBody(response);
  const message =
    typeof body.message === 'string' && body.message.trim() !== ''
      ? body.message
      : `Erro ${response.status} ao comunicar com o servidor`;
  const fieldErrors = isStringRecord(body.fieldErrors) ? body.fieldErrors : {};
  return new ApiError(response.status, message, fieldErrors);
}

/** Mensagem para o usuário: erros de campo (quando houver) ou a mensagem do backend. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const details = Object.values(error.fieldErrors);
    return details.length > 0 ? details.join('; ') : error.message;
  }
  return fallback;
}
