import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { UiPreviewBanner } from '@/dev/UiPreviewBanner';
import { colors, layout, spacing } from '@/theme';

type ScreenProps = {
  header?: ReactNode;
  children: ReactNode;
  /** Sticky bottom action bar (primary buttons), as in the wireframe forms. */
  footer?: ReactNode;
  /** Set false for screens that manage their own scrolling (e.g. FlatList). */
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Bottom edge is handled by the tab bar on tab root screens. */
  edges?: Edge[];
  testID?: string;
};

export function Screen({ header, children, footer, scroll = true, refreshing, onRefresh, edges = ['top'], testID }: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.sage} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.root} edges={edges} testID={testID}>
      <OfflineBanner />
      <UiPreviewBanner />
      {header}
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  content: { paddingHorizontal: layout.screenGutter, paddingTop: spacing.xs, paddingBottom: spacing.xxl, gap: spacing.lg },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: layout.screenGutter,
    paddingTop: 10,
    paddingBottom: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.stroke,
  },
});
