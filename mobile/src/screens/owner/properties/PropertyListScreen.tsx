import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { ChevronRight, MapPin, Plus, SearchX } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AppHeader, AppText, Badge, Button, Card, ChipGroup, EmptyState, InitialsTile, ProgressBar, QueryBoundary, Screen, SearchBar } from '@/components';
import { PropertiesEmptyState } from '@/features/properties/PropertiesEmptyState';
import { occupancyRate, type Stats } from '@/features/inventory/inventory';
import { statusLabel, type Property } from '@/features/properties/propertyContract';
import { useInventoryQuery } from '@/features/properties/queries';
import { usePropertyScope } from '@/features/properties/usePropertyScope';
import type { OwnerStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

/** Search appears once the list is long enough to need it. */
export const LIST_SEARCH_THRESHOLD = 4;
const ALL = '__all__';

/** Owner → Properties tab. */
export function PropertyListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<OwnerStackParamList>>();
  const { query, scope } = usePropertyScope();
  const inventory = useInventoryQuery();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>(ALL);
  const add = () => navigation.navigate('PropertyForm', {});
  const count = query.data?.length;

  return (
    <Screen
      testID="property-list-screen"
      refreshing={query.isRefetching}
      onRefresh={() => {
        void query.refetch();
        void inventory.refetch();
      }}
      header={
        <AppHeader
          large
          title={t('nav.properties')}
          subtitle={count ? t('common.propertiesCount', { count }) : undefined}
          right={
            count ? <Button label={t('properties.addShort')} icon={Plus} size="sm" fullWidth={false} onPress={add} testID="header-add-property" accessibilityHint={t('properties.add')} /> : undefined
          }
        />
      }
    >
      <QueryBoundary
        query={query}
        isEmpty={(list) => list.length === 0}
        errorTitle={t('properties.loadError')}
        renderEmpty={() => <PropertiesEmptyState onAdd={add} />}
      >
        {(list) => (
          <PropertyList
            list={list}
            scope={scope}
            stats={inventory.data?.byProperty}
            inventoryReady={inventory.isSuccess}
            search={search}
            onSearch={setSearch}
            type={type}
            onType={setType}
            onOpen={(id) => navigation.navigate('PropertyDetails', { propertyId: id })}
          />
        )}
      </QueryBoundary>
    </Screen>
  );
}

type ListProps = {
  list: Property[];
  scope: string;
  stats: Record<string, Stats> | undefined;
  inventoryReady: boolean;
  search: string;
  onSearch: (v: string) => void;
  type: string;
  onType: (v: string) => void;
  onOpen: (id: string) => void;
};

function PropertyList({ list, scope, stats, inventoryReady, search, onSearch, type, onType, onOpen }: ListProps) {
  const { t } = useTranslation();
  const types = useMemo(() => [...new Set(list.map((p) => p.type).filter(Boolean))].sort(), [list]);
  const q = search.trim().toLowerCase();
  const visible = list.filter(
    (p) => (type === ALL || p.type === type) && (!q || `${p.name} ${p.code} ${p.city} ${p.state}`.toLowerCase().includes(q)),
  );

  return (
    <View style={styles.list}>
      {list.length >= LIST_SEARCH_THRESHOLD ? <SearchBar value={search} onChangeText={onSearch} placeholder={t('properties.searchPlaceholder')} testID="property-search" /> : null}
      {types.length >= 2 ? (
        <ChipGroup
          scroll
          accessibilityLabel={t('properties.filterByType')}
          options={[{ value: ALL, label: t('properties.allTypes'), count: list.length }, ...types.map((v) => ({ value: v, label: v, count: list.filter((p) => p.type === v).length }))]}
          value={type}
          onChange={onType}
        />
      ) : null}
      {visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={t('properties.noSearchResults')}
          message={t('properties.noSearchHint')}
          actionLabel={t('properties.clearFilters')}
          onAction={() => {
            onSearch('');
            onType(ALL);
          }}
        />
      ) : (
        visible.map((p) => <PropertyCard key={p.id} property={p} current={scope === p.id} stats={stats?.[p.id]} inventoryReady={inventoryReady} onPress={() => onOpen(p.id)} />)
      )}
    </View>
  );
}

function PropertyCard({ property: p, current, stats, inventoryReady, onPress }: { property: Property; current: boolean; stats?: Stats; inventoryReady: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const status = statusLabel(p.status);
  const rate = stats ? occupancyRate(stats) : null;
  const location = [p.city, p.state].filter(Boolean).join(', ');

  return (
    <Card onPress={onPress} accessibilityLabel={p.name} testID={`property-row-${p.id}`} selected={current} style={styles.card}>
      <View style={styles.top}>
        <InitialsTile name={p.name} id={p.id} />
        <View style={styles.flex}>
          <AppText variant="bodyLarge" numberOfLines={1}>
            {p.name}
          </AppText>
          {location ? (
            <View style={styles.loc}>
              <MapPin size={13} color={colors.ink3} />
              <AppText variant="bodySmall" color={colors.ink2} numberOfLines={1} style={styles.flex}>
                {location}
              </AppText>
            </View>
          ) : null}
        </View>
        <ChevronRight size={18} color={colors.ink3} />
      </View>

      <View style={styles.badges}>
        {status ? <Badge label={status} tone={p.status === 'active' ? 'success' : 'neutral'} dot /> : null}
        {p.type ? <Badge label={p.type} tone="info" /> : null}
        {p.code ? <Badge label={p.code} tone="neutral" /> : null}
        {current ? <Badge label={t('properties.current')} tone="brand" /> : null}
      </View>

      {inventoryReady ? (
        <View style={styles.occ} testID={`occupancy-${p.id}`}>
          {stats && rate !== null ? (
            <>
              <View style={styles.occRow}>
                <AppText variant="caption" color={colors.ink2}>
                  {t('properties.bedsOccupied', { occupied: stats.occupied, total: stats.beds - stats.inactive })}
                </AppText>
                <AppText variant="caption" weight="bold" color={colors.ink}>
                  {Math.round(rate * 100)}%
                </AppText>
              </View>
              <ProgressBar value={rate} tone={rate >= 0.9 ? 'success' : rate >= 0.6 ? 'info' : 'warning'} />
            </>
          ) : (
            <AppText variant="caption" color={colors.ink3}>
              {t('properties.noBedsYet')}
            </AppText>
          )}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: { gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, minWidth: 0 },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  occ: { gap: 6, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.stroke },
  occRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
