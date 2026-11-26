import { isAxiosError } from 'axios';
import type { TFunction } from 'i18next';

import { isApiEnvelope } from './types/envelope';

export type ApiErrorKind =
  | 'network' // no connection / DNS / server unreachable
  | 'timeout'
  | 'unauthorized' // 401
  | 'forbidden' // 403
  | 'notFound' // 404
  | 'validation' // 422 (the API does not say which field failed)
  | 'server' // 5xx
  | 'contract' // response didn't match the documented/expected shape
  | 'business' // envelope with success:false on a 2xx/4xx not covered above
  | 'unknown';

/**
 * Single error type for everything the API layer throws.
 * - `serverMessage` is the backend's own user-facing text (`errorMessage`, else `message`).
 * - `displayMessage()` decides what is safe to show; raw technical errors never reach the UI.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly serverMessage?: string;

  constructor(kind: ApiErrorKind, opts: { status?: number; serverMessage?: string; cause?: unknown } = {}) {
    super(opts.serverMessage ?? kind);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = opts.status;
    this.serverMessage = opts.serverMessage;
    if (opts.cause !== undefined) (this as { cause?: unknown }).cause = opts.cause;
  }

  /** Normalises anything thrown (axios error, ApiError, unknown) into an ApiError. */
  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;
    if (isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return new ApiError('timeout', { cause: error });
      if (!error.response) return new ApiError('network', { cause: error });
      const status = error.response.status;
      const body: unknown = error.response.data;
      const serverMessage = isApiEnvelope(body) ? (body.errorMessage ?? body.message) || undefined : undefined;
      return new ApiError(kindForStatus(status), { status, serverMessage, cause: error });
    }
    return new ApiError('unknown', { cause: error });
  }

  /**
   * What to show the user. Backend messages are written for users (see envelope.ts), so they are shown
   * for 4xx/business errors; 5xx, network and contract problems always use the app's own wording.
   */
  displayMessage(t: TFunction): string {
    const useServer = this.serverMessage && ['unauthorized', 'forbidden', 'notFound', 'validation', 'business'].includes(this.kind);
    if (this.kind === 'unauthorized') return t('errors.unauthorized');
    if (useServer) return this.serverMessage as string;
    return t(`errors.${this.kind === 'business' ? 'unknown' : this.kind}`);
  }
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 408) return 'timeout';
  if (status === 422 || status === 400) return 'validation';
  if (status >= 500) return 'server';
  return 'business';
}
