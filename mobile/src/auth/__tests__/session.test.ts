import { authService } from '@/api/services/auth';
import { apiErrorFor, networkError, realResponses } from '@/test-utils/apiResponses';
import { onSignOut, useSession } from '../session';
import { tokenStorage } from '../tokenStorage';

jest.mock('@/api/services/auth', () => ({ authService: { login: jest.fn(), refresh: jest.fn(), logout: jest.fn() } }));

// In-memory stand-in for SecureStore so the session logic can be tested in Node.
const mockStore = new Map<string, string>();
jest.mock('../tokenStorage', () => ({
  tokenStorage: {
    getRefreshToken: jest.fn(async () => mockStore.get('refresh') ?? null),
    setRefreshToken: jest.fn(async (v: string) => void mockStore.set('refresh', v)),
    getRole: jest.fn(async () => mockStore.get('role') ?? null),
    setRole: jest.fn(async (v: string) => void mockStore.set('role', v)),
    clear: jest.fn(async () => mockStore.clear()),
  },
}));

const auth = authService as jest.Mocked<typeof authService>;
const storage = tokenStorage as jest.Mocked<typeof tokenStorage>;
const STORED_REFRESH = 'stored-refresh-token-000000000000';

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.clear();
  useSession.setState({ status: 'restoring', role: 'unknown', accessToken: null, expired: false });
});

describe('restore()', () => {
  it('goes to login when no session is stored', async () => {
    await useSession.getState().restore();
    expect(useSession.getState().status).toBe('signedOut');
    expect(auth.refresh).not.toHaveBeenCalled();
  });

  it('sends the stored refresh token in the documented RefreshRequest shape', async () => {
    mockStore.set('refresh', STORED_REFRESH);
    auth.refresh.mockRejectedValue(apiErrorFor(401, realResponses.refreshRejected401));
    await useSession.getState().restore();
    expect(auth.refresh).toHaveBeenCalledWith({ refresh_token: STORED_REFRESH });
  });

  it('ends the session and says so when the server rejects the refresh token (real 401)', async () => {
    mockStore.set('refresh', STORED_REFRESH);
    auth.refresh.mockRejectedValue(apiErrorFor(401, realResponses.refreshRejected401));
    await useSession.getState().restore();
    expect(useSession.getState()).toMatchObject({ status: 'signedOut', expired: true, accessToken: null });
    expect(mockStore.size).toBe(0);
  });

  it('treats a 422 on refresh as a dead token (real 422)', async () => {
    mockStore.set('refresh', STORED_REFRESH);
    auth.refresh.mockRejectedValue(apiErrorFor(422, realResponses.validation422));
    await useSession.getState().restore();
    expect(useSession.getState()).toMatchObject({ status: 'signedOut', expired: true });
  });

  it('keeps the stored session when offline, so the user can retry', async () => {
    mockStore.set('refresh', STORED_REFRESH);
    auth.refresh.mockRejectedValue(networkError());
    await useSession.getState().restore();
    expect(useSession.getState().status).toBe('restoreFailed');
    expect(mockStore.get('refresh')).toBe(STORED_REFRESH);
  });

  it('does not hang on the splash screen when secure storage fails', async () => {
    storage.getRefreshToken.mockRejectedValueOnce(new Error('Keystore unavailable'));
    await useSession.getState().restore();
    expect(useSession.getState()).toMatchObject({ status: 'signedOut', expired: false });
  });
});

describe('login()', () => {
  it('leaves the user signed out when the server rejects the credentials', async () => {
    useSession.setState({ status: 'signedOut' });
    auth.login.mockRejectedValue(apiErrorFor(401, realResponses.badAccessToken401));
    await expect(useSession.getState().login({ email: 'owner@example.com', password: 'wrong' })).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(useSession.getState().status).toBe('signedOut');
  });

  it('clears a previous account before saving the new session', async () => {
    mockStore.set('refresh', 'previous-account-refresh-token-00000');
    mockStore.set('role', 'resident');
    // Response contract still unconfirmed: only data.access_token is required (see authContract.ts).
    auth.login.mockResolvedValue({ access_token: 'header.e30.signature' });
    await useSession.getState().login({ email: 'owner@example.com', password: 'secret' });
    expect(mockStore.has('refresh')).toBe(false);
    expect(mockStore.has('role')).toBe(false);
    expect(useSession.getState()).toMatchObject({ status: 'signedIn', role: 'unknown' });
  });
});

describe('logout()', () => {
  it('signs out locally even when the server says the token is already revoked (real 401)', async () => {
    mockStore.set('refresh', STORED_REFRESH);
    useSession.setState({ status: 'signedIn', role: 'owner', accessToken: 'a.b.c' });
    auth.logout.mockRejectedValue(apiErrorFor(401, realResponses.logoutRejected401));
    const listener = jest.fn();
    const off = onSignOut(listener);
    await useSession.getState().logout();
    off();
    expect(auth.logout).toHaveBeenCalledWith({ refresh_token: STORED_REFRESH });
    expect(useSession.getState()).toMatchObject({ status: 'signedOut', accessToken: null, expired: false });
    expect(mockStore.size).toBe(0);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('signs out when offline or when secure storage fails', async () => {
    useSession.setState({ status: 'signedIn', role: 'owner', accessToken: 'a.b.c' });
    storage.getRefreshToken.mockRejectedValueOnce(new Error('Keystore unavailable'));
    storage.clear.mockRejectedValueOnce(new Error('Keystore unavailable'));
    await useSession.getState().logout();
    expect(useSession.getState().status).toBe('signedOut');
  });
});

describe('expire()', () => {
  it('only ends an active session', async () => {
    useSession.setState({ status: 'signedOut' });
    await useSession.getState().expire();
    expect(useSession.getState().expired).toBe(false);

    useSession.setState({ status: 'signedIn', role: 'owner', accessToken: 'a.b.c' });
    await useSession.getState().expire();
    expect(useSession.getState()).toMatchObject({ status: 'signedOut', expired: true });
  });
});
