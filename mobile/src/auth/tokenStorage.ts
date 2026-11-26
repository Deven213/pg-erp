import * as SecureStore from 'expo-secure-store';

/**
 * Token persistence.
 * - Refresh token: iOS Keychain / Android Keystore via expo-secure-store, readable only on this device after unlock.
 * - Access token: kept in memory only (see session.ts) and re-issued with the refresh token on app start.
 * Never log values read from here.
 */
const KEYS = {
  refreshToken: 'pgerp.refreshToken',
  role: 'pgerp.role',
  propertyScope: 'pgerp.propertyScope',
} as const;

const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const tokenStorage = {
  getRefreshToken: () => SecureStore.getItemAsync(KEYS.refreshToken, options),
  setRefreshToken: (token: string) => SecureStore.setItemAsync(KEYS.refreshToken, token, options),
  /** Last role the server confirmed — used only to pick the navigation tree when restoring a session. */
  getRole: () => SecureStore.getItemAsync(KEYS.role, options),
  setRole: (role: string) => SecureStore.setItemAsync(KEYS.role, role, options),
  /** The owner's last property choice ('all' or a property id), so it survives app restarts (wireframe D-02). Not secret. */
  getPropertyScope: () => SecureStore.getItemAsync(KEYS.propertyScope, options),
  setPropertyScope: (scope: string) => SecureStore.setItemAsync(KEYS.propertyScope, scope, options),
  /** Removes everything this account stored on the device. */
  async clear(): Promise<void> {
    await Promise.all(Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key, options)));
  },
};
