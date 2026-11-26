import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * true = online, false = offline, null = not known yet.
 * `isInternetReachable` can be null while the check is running; treat that as online to avoid a flashing banner.
 */
export function useIsOnline(): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(
    () =>
      NetInfo.addEventListener((s) => {
        setOnline(s.isConnected !== false && s.isInternetReachable !== false);
      }),
    [],
  );
  return online;
}
