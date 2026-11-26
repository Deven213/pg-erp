import type { Property } from '../propertyContract';
import { emptyPropertyForm, formValuesFrom, propertyFormSchema, toPropertyUpsert } from '../propertyForm';

const valid = {
  name: '  Sunrise Test PG ',
  code: 'STP-1',
  type: 'Boys PG',
  address: '14 Test Society',
  city: 'Vadodara',
  state: 'Gujarat',
  pincode: '390007',
  description: '',
};

const existing: Property = {
  id: 'p-1',
  tenantId: 't-owner',
  name: 'Old',
  code: 'OLD',
  address: 'a',
  city: 'c',
  state: 's',
  pincode: '390001',
  type: 'Co-living',
  description: 'Notes',
  imageUrl: 'https://example.com/x.jpg',
  status: 'inactive',
};

describe('property form validation', () => {
  it('requires every PropertyUpsert required field', () => {
    const r = propertyFormSchema.safeParse(emptyPropertyForm);
    expect(r.success).toBe(false);
    const fields = r.error!.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(['name', 'code', 'type', 'address', 'city', 'state', 'pincode']));
    expect(fields).not.toContain('description');
  });

  it('enforces spec length limits', () => {
    const r = propertyFormSchema.safeParse({ ...valid, name: 'x'.repeat(201), code: 'x'.repeat(51), type: 'x'.repeat(51), city: 'x'.repeat(101) });
    expect(r.error!.issues.map((i) => [i.path[0], i.message])).toEqual(
      expect.arrayContaining([
        ['name', 'validation.tooLong'],
        ['code', 'validation.tooLong'],
        ['type', 'validation.tooLong'],
        ['city', 'validation.tooLong'],
      ]),
    );
  });

  it('checks the PIN code', () => {
    expect(propertyFormSchema.safeParse({ ...valid, pincode: '012345' }).success).toBe(false);
    expect(propertyFormSchema.safeParse({ ...valid, pincode: '39000' }).success).toBe(false);
    expect(propertyFormSchema.safeParse(valid).success).toBe(true);
  });
});

describe('toPropertyUpsert', () => {
  it('builds a create body with the owner tenant and no id/status/image', () => {
    const body = toPropertyUpsert(propertyFormSchema.parse(valid), { tenantId: 't-owner' });
    expect(body).toEqual({
      tenant_id: 't-owner',
      property_name: 'Sunrise Test PG',
      property_code: 'STP-1',
      address: '14 Test Society',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '390007',
      property_type: 'Boys PG',
      description: null,
    });
  });

  it('keeps id, tenant, status and image when editing', () => {
    const body = toPropertyUpsert(propertyFormSchema.parse(formValuesFrom(existing)), { tenantId: 'other', existing });
    expect(body).toMatchObject({ id: 'p-1', tenant_id: 't-owner', status: 'inactive', image_url: 'https://example.com/x.jpg', description: 'Notes' });
  });
});
