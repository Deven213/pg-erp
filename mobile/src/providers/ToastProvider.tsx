import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, CircleX } from 'lucide-react-native';

import { AppText } from '@/components/common/AppText';
import { colors, spacing } from '@/theme';

type ToastKind = 'success' | 'error';
type ToastState = { id: number; message: string; kind: ToastKind } | null;
type ToastApi = { show: (message: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, kind });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const api = useMemo(() => ({ show }), [show]);
  const Icon = toast?.kind === 'error' ? CircleX : CircleCheck;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <View
          pointerEvents="none"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.toast, { bottom: 96 + insets.bottom, backgroundColor: toast.kind === 'error' ? colors.red : colors.ink }]}
        >
          <Icon size={18} color={toast.kind === 'error' ? colors.white : '#5FD38D'} />
          <AppText color={colors.white} style={{ flex: 1 }}>
            {toast.message}
          </AppText>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
});
