/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PROPERTY RESPONSE CONTRACT — UNVERIFIED
 * ─────────────────────────────────────────────────────────────────────────────
 * OpenAPI v0.1.0 documents the property REQUEST (PropertyUpsert) but types every response `data` as `any`.
 * This file is the ONLY place that reads property records out of responses.
 *
 * Assumptions to confirm against a real GET /api/v1/properties response:
 *   • the list `data` is a JSON array of property records;
 *   • GET ?id= returns either that record or a one-item array;
 *   • records use the same snake_case field names as PropertyUpsert (id, tenant_id, property_name, …).
 * If a response doesn't fit, a 'contract' error is thrown instead of showing partial or guessed data.
 */
import { ApiError } from '@/api/errors';

export type Property = {
  id: string;
  tenantId: string | null;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  type: string;
  description: string | null;
  imageUrl: string | null;
  /** Spec default is "active"; other values are not enumerated in the spec. */
  status: string | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
const optStr = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);

/** One record → Property, or null if it lacks the two fields every screen needs (id, property_name). */
export function toProperty(raw: unknown): Property | null {
  const r = asRecord(raw);
  if (!r) return null;
  const id = r.id;
  const name = r.property_name;
  if (typeof id !== 'string' || id.length === 0 || typeof name !== 'string') return null;
  return {
    id,
    tenantId: optStr(r.tenant_id),
    name,
    code: str(r.property_code),
    address: str(r.address),
    city: str(r.city),
    state: str(r.state),
    pincode: str(r.pincode),
    type: str(r.property_type),
    description: optStr(r.description),
    imageUrl: optStr(r.image_url),
    status: optStr(r.status),
  };
}

/** GET /properties `data` → Property[]. Throws ApiError('contract') if it isn't an array of recognisable records. */
export function parsePropertyList(data: unknown): Property[] {
  if (!Array.isArray(data)) throw new ApiError('contract');
  const items = data.map(toProperty);
  if (items.some((p) => p === null)) throw new ApiError('contract');
  return items as Property[];
}

/** GET /properties?id= `data` → Property. Accepts the record itself or a list containing it. */
export function parseProperty(data: unknown, id: string): Property {
  const candidates = Array.isArray(data) ? data : [data];
  const match = candidates.map(toProperty).find((p) => p?.id === id);
  if (match) return match;
  if (Array.isArray(data) && data.length === 0) throw new ApiError('notFound');
  throw new ApiError('contract');
}

/** "active" → Active; anything else is shown as sent. */
export function statusLabel(status: string | null): string | null {
  if (!status) return null;
  return status.charAt(0).toUpperCase() + status.slice(1);
}
