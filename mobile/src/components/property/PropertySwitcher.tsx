import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Building, Check, ChevronDown, Layers, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/common/AppText';
import { BottomSheet } from '@/components/common/BottomSheet';
import { Button } from '@/components/common/Button';
import { ListGroup, ListItem } from '@/components/common/ListItem';
import { SearchBar } from '@/components/common/SearchBar';
import type { PropertyScope } from '@/store/propertyContext';
import { colors, radius, spacing } from '@/theme';

export type PropertyOption = { id: string; name: string; subtitle?: string };

/** The wireframe shows a search box in the sheet once an owner has this many properties. */
export const SWITCHER_SEARCH_THRESHOLD = 6;

type PropertySwitcherProps = {
  /** Properties the owner can see — supplied by the properties query (never hard-coded). */
  properties: PropertyOption[];
  scope: PropertyScope;
  onChange: (scope: PropertyScope) => void;
  onAddProperty?: () => void;
};

/**
 * The "All Properties ▾" chip and its bottom sheet from the wireframe (D-01/D-02).
 * Hidden when the owner has fewer than two properties, as the wireframe specifies.
 */
export function PropertySwitcher({ properties, scope, onChange, onAddProperty }: PropertySwitcherProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  if (properties.length < 2) return null;

  const current = scope === 'all' ? null : properties.find((p) => p.id === scope);
  const label = current?.name ?? t('common.allProperties');
  const q = query.trim().toLowerCase();
  const visible = q ? properties.filter((p) => `${p.name} ${p.subtitle ?? ''}`.toLowerCase().includes(q)) : properties;
  const close = () => {
    setOpen(false);
    setQuery('');
  };
  const choose = (id: PropertyScope) => {
    onChange(id);
    close();
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('common.switchProperty')}: ${label}`}
        onPress={() => setOpen(true)}
        style={[styles.chip, current && { borderColor: colors.sage }]}
        testID="property-switcher"
      >
        {current ? <View style={styles.dot} /> : <Layers size={14} color={colors.ink} />}
        <AppText variant="bodySmall" weight="semibold" numberOfLines={1} style={styles.label}>
          {label}
          {current ? '' : ` · ${properties.length}`}
        </AppText>
        <ChevronDown size={14} color={colors.ink} />
      </Pressable>
      <BottomSheet visible={open} onClose={close} title={t('common.switchProperty')} subtitle={t('common.switchPropertyHint')}>
        <View style={styles.sheet}>
          {properties.length >= SWITCHER_SEARCH_THRESHOLD ? (
            <SearchBar value={query} onChangeText={setQuery} placeholder={t('properties.searchPlaceholder')} testID="switcher-search" />
          ) : null}
          <ListGroup>
            {!q ? (
              <ListItem
                icon={Layers}
                iconTone="brand"
                title={t('common.allProperties')}
                subtitle={t('common.propertiesCount', { count: properties.length })}
                right={scope === 'all' ? <Check size={18} color={colors.sage} /> : undefined}
                showChevron={false}
                last={visible.length === 0}
                onPress={() => choose('all')}
                testID="switcher-all"
              />
            ) : null}
            {visible.map((p, i) => (
              <ListItem
                key={p.id}
                icon={Building}
                iconTone="info"
                title={p.name}
                subtitle={p.subtitle}
                last={i === visible.length - 1}
                right={scope === p.id ? <Check size={18} color={colors.sage} /> : undefined}
                showChevron={false}
                onPress={() => choose(p.id)}
                testID={`switcher-option-${p.id}`}
              />
            ))}
          </ListGroup>
          {q && visible.length === 0 ? (
            <AppText variant="caption" color={colors.ink3} align="center">
              {t('properties.noSearchResults')}
            </AppText>
          ) : null}
          {onAddProperty ? (
            <Button
              label={t('properties.add')}
              icon={Plus}
              variant="secondary"
              onPress={() => {
                close();
                onAddProperty();
              }}
            />
          ) : null}
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: colors.card,
    maxWidth: 260,
  },
  label: { flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.sage },
  sheet: { gap: spacing.md },
});
