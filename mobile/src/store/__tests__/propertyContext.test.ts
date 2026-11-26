import { setPropertyScopePersistence, usePropertyContext } from '../propertyContext';

jest.mock('@/auth/tokenStorage', () => {
  const mockSaved: { scope: string | null } = { scope: null };
  return {
    mockSaved,
    tokenStorage: {
      getPropertyScope: jest.fn(async () => mockSaved.scope),
      setPropertyScope: jest.fn(async (v: string) => {
        mockSaved.scope = v;
      }),
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports -- read the mock's shared state
const { mockSaved, tokenStorage } = require('@/auth/tokenStorage') as { mockSaved: { scope: string | null }; tokenStorage: { getPropertyScope: jest.Mock; setPropertyScope: jest.Mock } };
const flush = () => new Promise<void>((r) => setImmediate(() => r()));

beforeEach(() => {
  mockSaved.scope = null;
  setPropertyScopePersistence(true);
  usePropertyContext.getState().reset();
  jest.clearAllMocks();
});

describe('property context', () => {
  it('starts on All Properties and saves a new choice on the device', async () => {
    expect(usePropertyContext.getState().scope).toBe('all');
    usePropertyContext.getState().setScope('p-2');
    await flush();
    expect(usePropertyContext.getState().scope).toBe('p-2');
    expect(mockSaved.scope).toBe('p-2');
  });

  it('restores the saved choice after a restart', async () => {
    mockSaved.scope = 'p-9';
    await usePropertyContext.getState().hydrate();
    expect(usePropertyContext.getState()).toMatchObject({ scope: 'p-9', hydrated: true });
  });

  it('falls back to All Properties when storage fails', async () => {
    tokenStorage.getPropertyScope.mockRejectedValueOnce(new Error('keystore'));
    await usePropertyContext.getState().hydrate();
    expect(usePropertyContext.getState().scope).toBe('all');
  });

  it('does not persist while the UI preview is active', async () => {
    setPropertyScopePersistence(false);
    usePropertyContext.getState().setScope('preview-1');
    await usePropertyContext.getState().hydrate();
    await flush();
    expect(tokenStorage.setPropertyScope).not.toHaveBeenCalled();
    expect(tokenStorage.getPropertyScope).not.toHaveBeenCalled();
  });
});
