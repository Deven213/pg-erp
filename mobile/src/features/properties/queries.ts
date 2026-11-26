import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PropertyUpsert } from '@/api/types/models';
import { useSession } from '@/auth/session';
import { useUiPreview } from '@/dev/uiPreview';
import { fetchInventory } from '@/features/inventory/inventory';
import { usePropertyContext } from '@/store/propertyContext';
import { propertyApi, type PropertySource } from './propertyApi';
import type { Property } from './propertyContract';
import { PREVIEW_TENANT_ID } from './previewPropertyStore';

/** Preview and real data never share a cache entry. */
export function usePropertySource(): PropertySource {
  return useUiPreview((s) => s.role) === 'owner' ? 'preview' : 'api';
}

export const propertyKeys = {
  all: (source: PropertySource) => ['properties', source] as const,
  list: (source: PropertySource) => ['properties', source, 'list'] as const,
  detail: (source: PropertySource, id: string) => ['properties', source, 'detail', id] as const,
};

/** Buildings / rooms / beds summary for the dashboard and property cards. Never blocks the screen if it fails. */
export function useInventoryQuery() {
  const source = usePropertySource();
  return useQuery({ queryKey: ['inventory', source] as const, queryFn: () => fetchInventory(source) });
}

export function usePropertiesQuery() {
  const source = usePropertySource();
  return useQuery({ queryKey: propertyKeys.list(source), queryFn: () => propertyApi.list(source) });
}

export function usePropertyQuery(id: string) {
  const source = usePropertySource();
  const qc = useQueryClient();
  return useQuery({
    queryKey: propertyKeys.detail(source, id),
    queryFn: () => propertyApi.get(id, source),
    // Show the row from the list instantly while the single record loads.
    placeholderData: () => qc.getQueryData<Property[]>(propertyKeys.list(source))?.find((p) => p.id === id),
  });
}

export function useSaveProperty() {
  const source = usePropertySource();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PropertyUpsert) => propertyApi.save(body, source),
    onSuccess: () => qc.invalidateQueries({ queryKey: propertyKeys.all(source) }),
  });
}

export function useDeleteProperty() {
  const source = usePropertySource();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => propertyApi.remove(id, source),
    onSuccess: (_data, id) => {
      // A deleted property can't stay selected anywhere in the app.
      if (usePropertyContext.getState().scope === id) usePropertyContext.getState().setScope('all');
      qc.removeQueries({ queryKey: propertyKeys.detail(source, id) });
      void qc.invalidateQueries({ queryKey: ['inventory', source] });
      return qc.invalidateQueries({ queryKey: propertyKeys.list(source) });
    },
  });
}

/**
 * The business id a new property must carry (PropertyUpsert.tenant_id is required).
 * Order: the session (if the login response carries it — unverified) → the single tenant all existing
 * properties share → none. Never guessed; when null the Add form explains why it can't save.
 */
export function useOwnerTenantId(properties: Property[] | undefined): string | null {
  const sessionTenant = useSession((s) => s.tenantId);
  const source = usePropertySource();
  if (source === 'preview') return PREVIEW_TENANT_ID;
  if (sessionTenant) return sessionTenant;
  const ids = new Set((properties ?? []).map((p) => p.tenantId).filter((v): v is string => !!v));
  return ids.size === 1 ? ([...ids][0] ?? null) : null;
}
