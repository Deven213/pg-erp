import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from '@react-navigation/native';
import { Ellipsis, Eye, Layers, MapPin, Pencil, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/api/errors';
import {
  ActionSheet,
  AppHeader,
  AppText,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  IconButton,
  IconTile,
  InfoRow,
  InitialsTile,
  ProgressBar,
  QueryBoundary,
  Screen,
  SectionHeader,
} from '@/components';
import { occupancyRate, type Stats } from '@/features/inventory/inventory';
import { statusLabel, type Property } from '@/features/properties/propertyContract';
import { useDeleteProperty, useInventoryQuery, usePropertyQuery } from '@/features/properties/queries';
import type { OwnerStackParamList } from '@/navigation/types';
import { useToast } from '@/providers/ToastProvider';
import { usePropertyContext } from '@/store/propertyContext';
import { bedStatusTone, colors, spacing, tones } from '@/theme';

export function PropertyDetailsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<OwnerStackParamList>>();
  const { propertyId } = useRoute<RouteProp<OwnerStackParamList, 'PropertyDetails'>>().params;
  const query = usePropertyQuery(propertyId);
  const inventory = useInventoryQuery();
  const [menu, setMenu] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <Screen
      testID="property-details-screen"
      edges={['top', 'bottom']}
      refreshing={query.isRefetching}
      onRefresh={() => {
        void query.refetch();
        void inventory.refetch();
      }}
      header={
        <AppHeader
          title={query.data?.name ?? t('properties.detailsTitle')}
          onBack={() => navigation.goBack()}
          right={
            query.data ? (
              <IconButton label={t('properties.moreActions')} onPress={() => setMenu(true)} testID="details-menu">
                <Ellipsis size={20} color={colors.ink} />
              </IconButton>
            ) : undefined
          }
        />
      }
    >
      <QueryBoundary query={query} errorTitle={t('properties.loadOneError')}>
        {(p) => (
          <DetailsBody
            property={p}
            stats={inventory.data?.byProperty[p.id]}
            inventoryState={inventory.isPending ? 'loading' : inventory.isError ? 'error' : 'ready'}
            menu={menu}
            onCloseMenu={() => setMenu(false)}
            confirming={confirming}
            setConfirming={setConfirming}
            onEdit={() => navigation.navigate('PropertyForm', { propertyId })}
            onDeleted={() => navigation.goBack()}
          />
        )}
      </QueryBoundary>
    </Screen>
  );
}

type BodyProps = {
  property: Property;
  stats?: Stats;
  inventoryState: 'loading' | 'error' | 'ready';
  menu: boolean;
  onCloseMenu: () => void;
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  onEdit: () => void;
  onDeleted: () => void;
};

function DetailsBody({ property: p, stats, inventoryState, menu, onCloseMenu, confirming, setConfirming, onEdit, onDeleted }: BodyProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const scope = usePropertyContext((s) => s.scope);
  const setScope = usePropertyContext((s) => s.setScope);
  const remove = useDeleteProperty();
  const status = statusLabel(p.status);
  const isCurrent = scope === p.id;
  const rate = stats ? occupancyRate(stats) : null;
  const num = (n: number | undefined) => (inventoryState === 'ready' ? String(n ?? 0) : '—');

  const makeCurrent = () => {
    setScope(p.id);
    toast.show(t('properties.nowViewing', { name: p.name }));
  };

  const confirmDelete = () => {
    if (remove.isPending) return;
    remove.mutate(p.id, {
      onSuccess: () => {
        setConfirming(false);
        toast.show(t('properties.deleted', { name: p.name }));
        onDeleted();
      },
      onError: (e) => {
        setConfirming(false);
        toast.show(ApiError.from(e).displayMessage(t), 'error');
      },
    });
  };

  return (
    <View style={styles.body}>
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <InitialsTile name={p.name} id={p.id} size={56} />
          <View style={styles.flex}>
            <AppText variant="title" numberOfLines={2}>
              {p.name}
            </AppText>
            <View style={styles.loc}>
              <MapPin size={14} color={colors.ink3} />
              <AppText variant="bodySmall" color={colors.ink2} style={styles.flex} testID="property-address">
                {[p.address, p.city, p.state, p.pincode].filter(Boolean).join(', ')}
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.badges}>
          {status ? <Badge label={status} tone={p.status === 'active' ? 'success' : 'neutral'} dot /> : null}
          {p.type ? <Badge label={p.type} tone="info" /> : null}
          {isCurrent ? <Badge label={t('properties.current')} tone="brand" /> : null}
        </View>
        <View style={styles.statsRow}>
          <MiniStat label={t('dashboard.buildings')} value={num(stats?.buildings)} />
          <MiniStat label={t('dashboard.rooms')} value={num(stats?.rooms)} />
          <MiniStat label={t('dashboard.beds')} value={num(stats?.beds)} />
          <MiniStat label={t('dashboard.occupancy')} value={rate !== null ? `${Math.round(rate * 100)}%` : '—'} last />
        </View>
      </Card>

      {isCurrent ? (
        <View style={styles.notice}>
          <Eye size={16} color={colors.sage} />
          <AppText variant="bodySmall" color={colors.brand} style={styles.flex}>
            {t('properties.isCurrentHint')}
          </AppText>
        </View>
      ) : (
        <Button label={t('properties.makeCurrent')} variant="soft" icon={Eye} onPress={makeCurrent} testID="make-current" />
      )}

      {stats && stats.beds > 0 ? (
        <>
          <SectionHeader title={t('properties.bedStatus')} />
          <Card style={styles.occCard}>
            <ProgressBar value={rate ?? 0} />
            <View style={styles.legend}>
              {(['occupied', 'available', 'reserved', 'maintenance', 'inactive'] as const).map((s) => (
                <View key={s} style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: tones[bedStatusTone[s]].fg === colors.white ? colors.brand : tones[bedStatusTone[s]].fg }]} />
                  <AppText variant="bodySmall" color={colors.ink2}>
                    {t(`beds.${s}`)}
                  </AppText>
                  <AppText variant="bodySmall" weight="bold">
                    {stats[s]}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>
        </>
      ) : null}

      <SectionHeader title={t('properties.detailsSection')} />
      <Card style={styles.info}>
        <InfoRow label={t('properties.fields.code')} value={p.code || '—'} />
        <InfoRow label={t('properties.fields.type')} value={p.type || '—'} />
        <InfoRow label={t('properties.fields.city')} value={p.city || '—'} />
        <InfoRow label={t('properties.fields.state')} value={p.state || '—'} />
        <InfoRow label={t('properties.fields.pincode')} value={p.pincode || '—'} last />
      </Card>

      {p.description ? (
        <>
          <SectionHeader title={t('properties.fields.description')} />
          <Card>
            <AppText color={colors.ink2}>{p.description}</AppText>
          </Card>
        </>
      ) : null}

      <SectionHeader title={t('properties.structureSection')} />
      <Card style={styles.structure}>
        <IconTile icon={Layers} tone="neutral" />
        <View style={styles.flex}>
          <AppText weight="semibold">{t('properties.structureTitle')}</AppText>
          <AppText variant="bodySmall" color={colors.ink2}>
            {inventoryState === 'ready' && stats?.beds ? t('properties.structureSummary', { rooms: stats.rooms, beds: stats.beds }) : t('properties.structureNext')}
          </AppText>
        </View>
        <Badge label={t('common.comingSoon')} tone="neutral" />
      </Card>

      <View style={styles.footerRow}>
        <Button label={t('properties.edit')} variant="secondary" icon={Pencil} onPress={onEdit} style={styles.flex} />
        <Button label={t('properties.delete')} variant="dangerSoft" icon={Trash2} onPress={() => setConfirming(true)} style={styles.flex} testID="delete-property" />
      </View>

      <ActionSheet
        visible={menu}
        onClose={onCloseMenu}
        title={p.name}
        items={[
          { label: t('properties.edit'), icon: Pencil, onPress: onEdit, testID: 'menu-edit' },
          ...(isCurrent ? [] : [{ label: t('properties.makeCurrent'), icon: Eye, onPress: makeCurrent }]),
          { label: t('properties.delete'), icon: Trash2, destructive: true, onPress: () => setConfirming(true), testID: 'menu-delete' },
        ]}
      />
      <ConfirmDialog
        visible={confirming}
        destructive
        icon={Trash2}
        title={t('properties.deleteTitle', { name: p.name })}
        message={t('properties.deleteMessage')}
        confirmLabel={t('properties.delete')}
        loading={remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </View>
  );
}

function MiniStat({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.mini, !last && styles.miniDivider]}>
      <AppText variant="heading" numeric>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.ink3} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg },
  flex: { flex: 1, minWidth: 0 },
  hero: { gap: spacing.md },
  heroTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  loc: { flexDirection: 'row', gap: 4, alignItems: 'flex-start', marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statsRow: { flexDirection: 'row', backgroundColor: colors.slate50, borderRadius: 12, paddingVertical: spacing.md },
  mini: { flex: 1, alignItems: 'center', gap: 2 },
  miniDivider: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.slate100 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.sageSoft, borderRadius: 12, padding: spacing.md },
  occCard: { gap: spacing.md },
  legend: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, columnGap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  info: { paddingVertical: spacing.xs },
  structure: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  footerRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
