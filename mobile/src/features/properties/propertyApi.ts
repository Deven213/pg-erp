import { propertiesService } from '@/api/services/resources';
import type { PropertyUpsert, Uuid } from '@/api/types/models';
import { useUiPreview } from '@/dev/uiPreview';
import { parseProperty, parsePropertyList, type Property } from './propertyContract';
import { previewPropertyStore } from './previewPropertyStore';

/**
 * Property data access for the screens. Uses ONLY the documented endpoints:
 *   GET /api/v1/properties · GET /api/v1/properties?id= · POST /api/v1/properties · DELETE /api/v1/properties/{id}
 * While the development UI preview is active it reads the in-memory preview store instead, so nothing
 * unauthenticated is ever sent to the server.
 */
export type PropertySource = 'api' | 'preview';

export const currentPropertySource = (): PropertySource => (useUiPreview.getState().role === 'owner' ? 'preview' : 'api');

const backend = (source: PropertySource) => (source === 'preview' ? previewPropertyStore : propertiesService);

export const propertyApi = {
  async list(source: PropertySource = currentPropertySource()): Promise<Property[]> {
    return parsePropertyList(await backend(source).list());
  },
  async get(id: Uuid, source: PropertySource = currentPropertySource()): Promise<Property> {
    return parseProperty(await backend(source).getById(id), id);
  },
  /** Create (no id) or update (with id). The response shape is unverified, so callers refetch instead of reading it. */
  async save(body: PropertyUpsert, source: PropertySource = currentPropertySource()): Promise<void> {
    await backend(source).save(body);
  },
  async remove(id: Uuid, source: PropertySource = currentPropertySource()): Promise<void> {
    await backend(source).remove(id);
  },
};
