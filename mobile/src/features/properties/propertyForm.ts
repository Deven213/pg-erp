import { z } from 'zod';

import type { PropertyUpsert } from '@/api/types/models';
import { fieldRules } from '@/utils/validation';
import type { Property } from './propertyContract';

/**
 * Add/Edit property form. Every field maps to a documented PropertyUpsert field; limits come from the spec.
 * Not in the form: tenant_id (from the session), status and image_url (no documented values / no upload
 * endpoint — kept unchanged on edit, server default on create).
 */
export const propertyFormSchema = z.object({
  name: fieldRules.requiredText(200),
  code: fieldRules.requiredText(50),
  type: fieldRules.requiredText(50),
  address: z.string().trim().min(1, 'validation.required'),
  city: fieldRules.requiredText(100),
  state: fieldRules.requiredText(100),
  /** Spec allows ≤10 chars; the app expects an Indian PIN code. */
  pincode: fieldRules.pincode(),
  description: z.string().trim(),
});

export type PropertyFormValues = z.input<typeof propertyFormSchema>;
export type PropertyFormOutput = z.output<typeof propertyFormSchema>;

export const emptyPropertyForm: PropertyFormValues = { name: '', code: '', type: '', address: '', city: '', state: '', pincode: '', description: '' };

export function formValuesFrom(p: Property): PropertyFormValues {
  return { name: p.name, code: p.code, type: p.type, address: p.address, city: p.city, state: p.state, pincode: p.pincode, description: p.description ?? '' };
}

/**
 * Builds the request body. On edit the full record is sent (whether POST-with-id does a full or partial
 * update is undocumented), keeping the stored tenant_id, status and image_url.
 */
export function toPropertyUpsert(values: PropertyFormOutput, ctx: { tenantId: string; existing?: Property }): PropertyUpsert {
  const body: PropertyUpsert = {
    tenant_id: ctx.existing?.tenantId ?? ctx.tenantId,
    property_name: values.name,
    property_code: values.code,
    address: values.address,
    city: values.city,
    state: values.state,
    pincode: values.pincode,
    property_type: values.type,
    description: values.description ? values.description : null,
  };
  if (ctx.existing) {
    body.id = ctx.existing.id;
    body.image_url = ctx.existing.imageUrl;
    if (ctx.existing.status) body.status = ctx.existing.status;
  }
  return body;
}

/** Quick-fill choices for property_type, from the wireframe's "For: Boys / Girls / Co-living". Free text is allowed:
 *  the spec doesn't list accepted values. */
export const PROPERTY_TYPE_SUGGESTIONS = ['Boys PG', 'Girls PG', 'Co-living'] as const;
