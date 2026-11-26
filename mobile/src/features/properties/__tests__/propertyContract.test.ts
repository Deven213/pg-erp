import { ApiError } from '@/api/errors';
import { parseProperty, parsePropertyList, statusLabel, toProperty } from '../propertyContract';

/** Shaped like PropertyUpsert (the only documented shape). Not a captured server response. */
const record = {
  id: 'p-1',
  tenant_id: 't-1',
  property_name: 'Test Property',
  property_code: 'TP-1',
  address: '1 Test Street',
  city: 'Testcity',
  state: 'Teststate',
  pincode: '390001',
  property_type: 'Boys PG',
  description: null,
  image_url: null,
  status: 'active',
};

describe('property response contract', () => {
  it('maps PropertyUpsert field names to the app model', () => {
    expect(toProperty(record)).toEqual({
      id: 'p-1',
      tenantId: 't-1',
      name: 'Test Property',
      code: 'TP-1',
      address: '1 Test Street',
      city: 'Testcity',
      state: 'Teststate',
      pincode: '390001',
      type: 'Boys PG',
      description: null,
      imageUrl: null,
      status: 'active',
    });
  });

  it('rejects records without an id or name', () => {
    expect(toProperty({ property_name: 'x' })).toBeNull();
    expect(toProperty({ id: 'p' })).toBeNull();
    expect(toProperty('nope')).toBeNull();
  });

  it('parses a list and throws a contract error for anything else', () => {
    expect(parsePropertyList([record])).toHaveLength(1);
    expect(parsePropertyList([])).toEqual([]);
    expect(() => parsePropertyList({ items: [record] })).toThrow(ApiError);
    expect(() => parsePropertyList([record, { foo: 1 }])).toThrow(ApiError);
  });

  it('finds one record from an object or a list', () => {
    expect(parseProperty(record, 'p-1').name).toBe('Test Property');
    expect(parseProperty([record], 'p-1').code).toBe('TP-1');
    expect(() => parseProperty([], 'p-1')).toThrow(expect.objectContaining({ kind: 'notFound' }));
    expect(() => parseProperty({ other: true }, 'p-1')).toThrow(expect.objectContaining({ kind: 'contract' }));
  });

  it('formats status labels without inventing values', () => {
    expect(statusLabel('active')).toBe('Active');
    expect(statusLabel(null)).toBeNull();
  });
});
