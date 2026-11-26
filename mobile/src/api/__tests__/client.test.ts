import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { apiRequest, configureAuthBridge, createApiClient } from '../client';
import { ApiError } from '../errors';
import { realResponses } from '@/test-utils/apiResponses';
import { testJwt } from '@/test-utils/jwt';

const ok = (data: unknown) => ({ success: true, message: 'OK', errorMessage: null, data });
const unauthorized = realResponses.badAccessToken401;

/** Fake transport: answers 401 unless the request carries the expected token. */
function adapterExpecting(validToken: string, calls: string[]): AxiosAdapter {
  return async (config: InternalAxiosRequestConfig) => {
    const auth = String(config.headers.get('Authorization') ?? '');
    calls.push(`${config.url} ${auth}`);
    const respond = (status: number, data: unknown): AxiosResponse => ({ status, data, statusText: '', headers: {}, config });
    if (auth === `Bearer ${validToken}`) return respond(200, ok({ url: config.url }));
    throw new AxiosError('401', 'ERR_BAD_REQUEST', config, null, respond(401, unauthorized));
  };
}

afterEach(() => configureAuthBridge(null));

describe('early refresh from the JWT exp claim', () => {
  const nowSec = () => Math.floor(Date.now() / 1000);

  it('renews a token that expires within the margin before sending', async () => {
    const expiring = testJwt({ exp: nowSec() + 10 });
    const fresh = testJwt({ exp: nowSec() + 900 });
    let current = expiring;
    const refreshAccessToken = jest.fn(async () => (current = fresh));
    const calls: string[] = [];
    const client = createApiClient('https://api.test');
    client.defaults.adapter = adapterExpecting(fresh, calls);
    configureAuthBridge({ getAccessToken: () => current, refreshAccessToken, onSessionExpired: jest.fn() });

    await apiRequest({ url: '/api/v1/properties' }, client);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(calls).toEqual([`/api/v1/properties Bearer ${fresh}`]); // one request, no 401 round trip
  });

  it('does not refresh a token with plenty of time left', async () => {
    const valid = testJwt({ exp: nowSec() + 3600 });
    const refreshAccessToken = jest.fn();
    const client = createApiClient('https://api.test');
    client.defaults.adapter = adapterExpecting(valid, []);
    configureAuthBridge({ getAccessToken: () => valid, refreshAccessToken, onSessionExpired: jest.fn() });
    await apiRequest({ url: '/api/v1/beds' }, client);
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it('falls back to the normal 401 path if the early refresh fails', async () => {
    const expiring = testJwt({ exp: nowSec() + 5 });
    const onSessionExpired = jest.fn();
    const client = createApiClient('https://api.test');
    client.defaults.adapter = adapterExpecting('never-valid', []);
    configureAuthBridge({ getAccessToken: () => expiring, refreshAccessToken: () => Promise.reject(new ApiError('unauthorized')), onSessionExpired });
    await expect(apiRequest({ url: '/api/v1/rooms' }, client)).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});

describe('API client', () => {
  it('attaches the bearer token and unwraps envelope data', async () => {
    const calls: string[] = [];
    const client = createApiClient('https://api.test');
    client.defaults.adapter = adapterExpecting('good', calls);
    configureAuthBridge({ getAccessToken: () => 'good', refreshAccessToken: jest.fn(), onSessionExpired: jest.fn() });
    await expect(apiRequest({ url: '/api/v1/properties' }, client)).resolves.toEqual({ url: '/api/v1/properties' });
    expect(calls).toEqual(['/api/v1/properties Bearer good']);
  });

  it('refreshes once for concurrent 401s and retries each request', async () => {
    const calls: string[] = [];
    let token = 'stale';
    const refreshAccessToken = jest.fn(async () => {
      token = 'fresh';
      return 'fresh';
    });
    const client = createApiClient('https://api.test');
    client.defaults.adapter = adapterExpecting('fresh', calls);
    configureAuthBridge({ getAccessToken: () => token, refreshAccessToken, onSessionExpired: jest.fn() });

    await Promise.all([apiRequest({ url: '/api/v1/beds' }, client), apiRequest({ url: '/api/v1/rooms' }, client)]);
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(calls.filter((c) => c.endsWith('Bearer fresh'))).toHaveLength(2);
  });

  it('expires the session when refresh fails', async () => {
    const onSessionExpired = jest.fn();
    const client = createApiClient('https://api.test');
    client.defaults.adapter = adapterExpecting('never', []);
    configureAuthBridge({ getAccessToken: () => 'stale', refreshAccessToken: () => Promise.reject(new ApiError('unauthorized')), onSessionExpired });
    await expect(apiRequest({ url: '/api/v1/floors' }, client)).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('does not refresh or attach tokens on the login endpoint', async () => {
    const calls: string[] = [];
    const refreshAccessToken = jest.fn();
    const client = createApiClient('https://api.test');
    client.defaults.adapter = adapterExpecting('good', calls);
    configureAuthBridge({ getAccessToken: () => 'good', refreshAccessToken, onSessionExpired: jest.fn() });
    await expect(apiRequest({ url: '/api/v1/auth/login', method: 'POST' }, client)).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(calls).toEqual(['/api/v1/auth/login ']);
  });

  it('turns success:false on HTTP 200 into a business error', async () => {
    const client = createApiClient('https://api.test');
    client.defaults.adapter = async (config) => ({
      status: 200,
      data: { success: false, message: 'Not allowed.', errorMessage: 'Bed is occupied.', data: null },
      statusText: '',
      headers: {},
      config,
    });
    await expect(apiRequest({ url: '/health' }, client)).rejects.toMatchObject({ kind: 'business', serverMessage: 'Bed is occupied.' });
  });

  it('rejects bodies that are not the documented envelope', async () => {
    const client = createApiClient('https://api.test');
    client.defaults.adapter = async (config) => ({ status: 200, data: '<html>', statusText: '', headers: new AxiosHeaders(), config });
    await expect(apiRequest({ url: '/health' }, client)).rejects.toMatchObject({ kind: 'contract' });
  });
});
