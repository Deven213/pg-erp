import { useEffect } from 'react';

import { usePropertyContext } from '@/store/propertyContext';
import type { Property } from './propertyContract';
import { usePropertiesQuery } from './queries';

/**
 * The owner's current property context, checked against the real property list:
 * a saved choice that no longer exists (deleted, or from another account) falls back to All Properties.
 */
export function usePropertyScope() {
  const query = usePropertiesQuery();
  const scope = usePropertyContext((s) => s.scope);
  const setScope = usePropertyContext((s) => s.setScope);
  const hydrated = usePropertyContext((s) => s.hydrated);
  const hydrate = usePropertyContext((s) => s.hydrate);
  const properties: Property[] = query.data ?? [];

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const stale = hydrated && query.isSuccess && scope !== 'all' && !properties.some((p) => p.id === scope);
  useEffect(() => {
    if (stale) setScope('all');
  }, [stale, setScope]);

  const selected = scope === 'all' ? null : (properties.find((p) => p.id === scope) ?? null);
  return { scope: stale ? 'all' : scope, selected, properties, query, setScope };
}

/** "City · Type" line used in lists and the switcher. */
export function propertySubtitle(p: Pick<Property, 'city' | 'type'>): string {
  return [p.city, p.type].filter(Boolean).join(' · ');
}
