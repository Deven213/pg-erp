import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import type { TFunction } from 'i18next';

import { ApiError } from '../errors';

const t = ((key: string) => `t:${key}`) as unknown as TFunction;

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('fail', 'ERR_BAD_RESPONSE', config, null, response);
}

// Bodies below are copied from the live API (24 Nov 2026).
describe('ApiError.from', () => {
  it('maps a 401 envelope and keeps the server message', () => {
    const e = ApiError.from(
      axiosErrorWith(401, { success: false, message: 'Authentication failed.', errorMessage: 'The access token is invalid or expired.', data: [] }),
    );
    expect(e.kind).toBe('unauthorized');
    expect(e.serverMessage).toBe('The access token is invalid or expired.');
    expect(e.displayMessage(t)).toBe('t:errors.unauthorized');
  });

  it('maps a 422 envelope to validation and shows the server text', () => {
    const e = ApiError.from(
      axiosErrorWith(422, { success: false, message: 'Request validation failed.', errorMessage: 'Please check the request data and try again.', data: null }),
    );
    expect(e.kind).toBe('validation');
    expect(e.displayMessage(t)).toBe('Please check the request data and try again.');
  });

  it('never shows server text for 5xx errors', () => {
    const e = ApiError.from(axiosErrorWith(500, { success: false, message: 'Traceback…', errorMessage: 'psycopg2 error', data: null }));
    expect(e.kind).toBe('server');
    expect(e.displayMessage(t)).toBe('t:errors.server');
  });

  it('detects network failures and timeouts', () => {
    expect(ApiError.from(new AxiosError('Network Error', 'ERR_NETWORK')).kind).toBe('network');
    expect(ApiError.from(new AxiosError('timeout', 'ECONNABORTED')).kind).toBe('timeout');
  });

  it('wraps unknown errors', () => {
    expect(ApiError.from(new Error('boom')).kind).toBe('unknown');
  });
});
