import { apiRequest } from '../client';
import type { Uuid } from '../types/models';

/**
 * Every resource in OpenAPI v0.1.0 follows the same pattern:
 *   GET    /resource          → list
 *   GET    /resource?id=uuid  → one record (the only documented query parameter)
 *   POST   /resource          → create (no id) or update (with id)
 *   DELETE /resource/{id}     → delete
 * No pagination, filtering or sorting parameters exist yet, so none are sent.
 */
export type CrudService<TUpsert, TRecord = unknown> = {
  list: () => Promise<TRecord>;
  getById: (id: Uuid) => Promise<TRecord>;
  save: (body: TUpsert) => Promise<TRecord>;
  remove: (id: Uuid) => Promise<unknown>;
};

export function createCrudService<TUpsert, TRecord = unknown>(path: string): CrudService<TUpsert, TRecord> {
  return {
    list: () => apiRequest<TRecord>({ method: 'GET', url: path }),
    getById: (id) => apiRequest<TRecord>({ method: 'GET', url: path, params: { id } }),
    save: (body) => apiRequest<TRecord>({ method: 'POST', url: path, data: body }),
    remove: (id) => apiRequest<unknown>({ method: 'DELETE', url: `${path}/${encodeURIComponent(id)}` }),
  };
}
