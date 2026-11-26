import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { BedDouble, Building, CircleCheck, DoorOpen, History, IndianRupee, List, Plus, Receipt, TriangleAlert, UserPlus, Users, Wallet, Wrench } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react-native';

import { AppHeader, AppText, Card, ErrorState, IconTile, ListGroup, ListItem, LoadingState, ProgressBar, Screen, SectionHeader, StatTile } from '@/components';
import { PropertiesEmptyState } from '@/features/properties/PropertiesEmptyState';
import { emptyStats, occupancyRate, type Stats } from '@/features/inventory/inventory';
import { OwnerPropertySwitcher } from '@/features/properties/OwnerPropertySwitcher';
import { useInventoryQuery } from '@/features/properties/queries';
import { usePropertyScope } from '@/features/properties/usePropertyScope';
import type { OwnerStackParamList, OwnerTabParamList } from '@/navigation/types';
import { useToast } from '@/providers/ToastProvider';
import { colors, radius, spacing, tones, type Tone } from '@/theme';

const fmt = (n: number) => n.toLocaleString('en-IN');
/** Muted text on the forest-green hero card. */
const HERO_MUTED = '#A9C4B6';

/** Owner → Home. Every number comes from the API (or preview samples in development); unavailable data shows "—". */
export function OwnerDashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<OwnerStackParamList & OwnerTabParamList>>();
  const { query, properties, selected } = usePropertyScope();
  const inventory = useInventoryQuery();
  const addProperty = () => navigation.navigate('PropertyForm', {});

  const refreshing = query.isRefetching || inventory.isRefetching;
  const onRefresh = () => {
    void query.refetch();
    void inventory.refetch();
  };

  let body;
  if (query.isPending) body = <LoadingState rows={3} />;
  else if (query.isError && !query.data) body = <ErrorState error={query.error} title={t('dashboard.loadError')} onRetry={onRefresh} retrying={refreshing} />;
  else if (properties.length === 0) {
    body = <PropertiesEmptyState onAdd={addProperty} />;
  } else {
    // A property with nothing set up has a zero summary, which is different from "data unavailable".
    const stats: Stats | null = inventory.data ? (selected ? (inventory.data.byProperty[selected.id] ?? emptyStats()) : inventory.data.total) : null;
    const invLoading = inventory.isPending;
    const invValue = (n: number | undefined) => (invLoading || !inventory.data ? null : fmt(n ?? 0));
    const scopedProperties = selected ? [selected] : properties;
    const unsetUp = inventory.data ? scopedProperties.filter((p) => !(inventory.data!.byProperty[p.id]?.beds)) : [];

    body = (
      <>
        <OccupancyCard stats={stats} loading={invLoading} unavailable={inventory.isError} />

        <View style={styles.grid}>
          <StatTile icon={Building} label={t('dashboard.properties')} value={fmt(scopedProperties.length)} hint={selected ? selected.city || undefined : t('dashboard.inBusiness')} testID="stat-properties" />
          <StatTile icon={DoorOpen} tone="teal" label={t('dashboard.rooms')} value={invValue(stats?.rooms)} loading={invLoading} hint={stats ? t('dashboard.buildingsCount', { count: stats.buildings }) : undefined} testID="stat-rooms" />
        </View>
        <View style={styles.grid}>
          <StatTile icon={BedDouble} tone="violet" label={t('dashboard.beds')} value={invValue(stats?.beds)} loading={invLoading} hint={stats ? t('dashboard.occupiedCount', { count: stats.occupied }) : undefined} testID="stat-beds" />
          <StatTile icon={CircleCheck} tone="success" label={t('dashboard.vacant')} value={invValue(stats?.available)} loading={invLoading} hint={t('dashboard.readyToRent')} testID="stat-vacant" />
        </View>

        <SectionHeader title={t('dashboard.business')} />
        <Card style={styles.business}>
          <PendingMetric icon={Users} label={t('dashboard.activeResidents')} testID="stat-residents" />
          <PendingMetric icon={Wallet} label={t('dashboard.pendingRent')} testID="stat-pending" />
          <PendingMetric icon={IndianRupee} label={t('dashboard.collected')} testID="stat-collected" last />
          <AppText variant="caption" color={colors.ink2} style={styles.businessNote}>
            {t('dashboard.businessSoon')}
          </AppText>
        </Card>

        <SectionHeader title={t('dashboard.quickActions')} />
        <View style={styles.actions}>
          <QuickAction icon={Plus} label={t('dashboard.qaAddProperty')} tone="info" onPress={addProperty} />
          <QuickAction icon={List} label={t('dashboard.qaProperties')} tone="teal" onPress={() => navigation.navigate('OwnerTabs', { screen: 'OwnerProperties' })} />
          <QuickAction icon={UserPlus} label={t('dashboard.qaAddResident')} tone="violet" soon />
          <QuickAction icon={Receipt} label={t('dashboard.qaRecordPayment')} tone="warning" soon />
        </View>

        <SectionHeader title={t('dashboard.alerts')} />
        <Alerts stats={stats} unsetUp={unsetUp.map((p) => p.name)} inventoryFailed={inventory.isError} />

        <SectionHeader title={t('dashboard.activity')} />
        <Card style={styles.activity}>
          <IconTile icon={History} tone="neutral" />
          <View style={styles.flex}>
            <AppText weight="semibold">{t('dashboard.noActivity')}</AppText>
            <AppText variant="bodySmall" color={colors.ink2}>
              {t('dashboard.noActivityHint')}
            </AppText>
          </View>
        </Card>
      </>
    );
  }

  return (
    <Screen
      testID="owner-dashboard"
      refreshing={refreshing}
      onRefresh={onRefresh}
      header={
        <AppHeader
          large
          top={<OwnerPropertySwitcher />}
          title={selected ? selected.name : t('dashboard.title')}
          subtitle={selected ? t('dashboard.propertyView') : t('common.allProperties')}
        />
      }
    >
      {body}
    </Screen>
  );
}

function OccupancyCard({ stats, loading, unavailable }: { stats: Stats | null; loading: boolean; unavailable: boolean }) {
  const { t } = useTranslation();
  const rate = stats ? occupancyRate(stats) : null;
  let headline = '—';
  let caption = t('dashboard.occupancyUnavailable');
  if (loading) caption = t('states.loading');
  else if (!unavailable && stats && rate === null) caption = t('dashboard.occupancyNoBeds');
  else if (stats && rate !== null) {
    headline = `${Math.round(rate * 100)}%`;
    caption = t('dashboard.occupancyCaption', { occupied: fmt(stats.occupied), total: fmt(stats.beds - stats.inactive) });
  }
  return (
    <View style={styles.hero} testID="occupancy-card">
      <AppText variant="overline" color={HERO_MUTED}>
        {t('dashboard.occupancy')}
      </AppText>
      <AppText variant="display" color={colors.white} numeric accessibilityLabel={`${t('dashboard.occupancy')} ${headline}`}>
        {headline}
      </AppText>
      <AppText variant="bodySmall" color="#DCE7E0">
        {caption}
      </AppText>
      <ProgressBar value={rate ?? 0} color={colors.accent} style={styles.heroBar} />
      <View style={styles.heroRow}>
        <HeroStat label={t('dashboard.available')} value={stats ? fmt(stats.available) : '—'} dot="#8FD1A8" />
        <HeroStat label={t('dashboard.reserved')} value={stats ? fmt(stats.reserved) : '—'} dot={colors.accent} />
        <HeroStat label={t('dashboard.maintenance')} value={stats ? fmt(stats.maintenance) : '—'} dot="#F2D27A" />
      </View>
    </View>
  );
}

/** A business metric whose backend module isn't live yet: shows a dash, never a number. */
function PendingMetric({ icon: Icon, label, last, testID }: { icon: LucideIcon; label: string; last?: boolean; testID?: string }) {
  return (
    <View style={[styles.metricRow, !last && styles.metricDivider]} testID={testID}>
      <Icon size={18} color={colors.ink2} />
      <AppText style={styles.flex}>{label}</AppText>
      <AppText weight="semibold" color={colors.ink3} accessibilityLabel={`${label}: not available`}>
        —
      </AppText>
    </View>
  );
}

function HeroStat({ label, value, dot }: { label: string; value: string; dot: string }) {
  return (
    <View style={styles.heroStat}>
      <View style={styles.heroStatHead}>
        <View style={[styles.heroDot, { backgroundColor: dot }]} />
        <AppText variant="caption" color={HERO_MUTED}>
          {label}
        </AppText>
      </View>
      <AppText variant="bodyLarge" weight="bold" color={colors.white} numeric>
        {value}
      </AppText>
    </View>
  );
}

function QuickAction({ icon: Icon, label, tone, onPress, soon }: { icon: LucideIcon; label: string; tone: Tone; onPress?: () => void; soon?: boolean }) {
  const { t } = useTranslation();
  const toast = useToast();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={soon ? t('common.comingSoon') : undefined}
      onPress={soon ? () => toast.show(t('dashboard.soonToast', { name: label })) : onPress}
      style={({ pressed }) => [styles.qa, pressed && { opacity: 0.75 }]}
    >
      <View style={[styles.qaTile, { backgroundColor: soon ? colors.slate50 : tones[tone].bg }]}>
        <Icon size={22} color={soon ? colors.ink3 : tones[tone].fg} />
      </View>
      <AppText variant="caption" align="center" color={soon ? colors.ink3 : colors.ink} numberOfLines={2}>
        {label}
      </AppText>
      {soon ? (
        <AppText variant="caption" color={colors.ink3} style={styles.soon}>
          {t('common.comingSoon')}
        </AppText>
      ) : null}
    </Pressable>
  );
}

function Alerts({ stats, unsetUp, inventoryFailed }: { stats: Stats | null; unsetUp: string[]; inventoryFailed: boolean }) {
  const { t } = useTranslation();
  const items: { key: string; icon: LucideIcon; tone: Tone; title: string; subtitle: string }[] = [];
  if (inventoryFailed) items.push({ key: 'inv', icon: TriangleAlert, tone: 'warning', title: t('dashboard.alertInventoryTitle'), subtitle: t('dashboard.alertInventoryHint') });
  if (stats && stats.maintenance > 0)
    items.push({ key: 'mnt', icon: Wrench, tone: 'warning', title: t('dashboard.alertMaintenance', { count: stats.maintenance }), subtitle: t('dashboard.alertMaintenanceHint') });
  if (unsetUp.length > 0)
    items.push({ key: 'setup', icon: Building, tone: 'info', title: t('dashboard.alertSetup', { count: unsetUp.length }), subtitle: unsetUp.slice(0, 3).join(', ') });

  if (items.length === 0) {
    return (
      <Card style={styles.activity} testID="alerts-clear">
        <IconTile icon={CircleCheck} tone="success" />
        <View style={styles.flex}>
          <AppText weight="semibold">{t('dashboard.allClear')}</AppText>
          <AppText variant="bodySmall" color={colors.ink2}>
            {t('dashboard.allClearHint')}
          </AppText>
        </View>
      </Card>
    );
  }
  return (
    <ListGroup>
      {items.map((a, i) => (
        <ListItem key={a.key} icon={a.icon} iconTone={a.tone} title={a.title} subtitle={a.subtitle} last={i === items.length - 1} testID={`alert-${a.key}`} />
      ))}
    </ListGroup>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: { flexDirection: 'row', gap: spacing.md },
  business: { paddingVertical: spacing.xs },
  businessNote: { paddingTop: spacing.sm, paddingBottom: spacing.sm },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 },
  metricDivider: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  hero: { backgroundColor: colors.brand, borderRadius: radius.card + 4, padding: spacing.xl, gap: spacing.xs },
  heroBar: { marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.16)' },
  heroRow: { flexDirection: 'row', marginTop: spacing.lg, gap: spacing.md },
  heroStat: { flex: 1, gap: 2 },
  heroStatHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroDot: { width: 7, height: 7, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  qa: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: spacing.xs, minHeight: 88 },
  qaTile: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  soon: { fontSize: 10, lineHeight: 12 },
  activity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
