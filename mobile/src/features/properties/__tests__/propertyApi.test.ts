import { apiRequest } from '@/api/client';
import { propertyApi } from '../propertyApi';
import { PREVIEW_LATENCY_MS, previewPropertyStore, PREVIEW_TENANT_ID } from '../previewPropertyStore';

jest.mock('@/api/client', () => ({ apiRequest: jest.fn(), configureAuthBridge: jest.fn() }));

const request = apiRequest as jest.Mock;
const record = { id: 'p-1', tenant_id: 't-1', property_name: 'Test Property', property_code: 'TP-1', address: 'a', city: 'c', state: 's', pincode: '390001', property_type: 'Boys PG' };
const body = { tenant_id: 't-1', property_name: 'N', property_code: 'C', address: 'a', city: 'c', state: 's', pincode: '390001', property_type: 'Girls PG' };

beforeEach(() => request.mockReset());

describe('propertyApi (real API) uses only documented endpoints', () => {
  it('lists with GET /api/v1/properties', async () => {
    request.mockResolvedValue([record]);
    const list = await propertyApi.list('api');
    expect(request).toHaveBeenCalledWith({ method: 'GET', url: '/api/v1/properties' });
    expect(list[0]!.name).toBe('Test Property');
  });

  it('reads one with GET ?id=', async () => {
    request.mockResolvedValue([record]);
    await propertyApi.get('p-1', 'api');
    expect(request).toHaveBeenCalledWith({ method: 'GET', url: '/api/v1/properties', params: { id: 'p-1' } });
  });

  it('creates and updates with POST /api/v1/properties', async () => {
    request.mockResolvedValue(null);
    await propertyApi.save(body, 'api');
    await propertyApi.save({ ...body, id: 'p-1' }, 'api');
    expect(request).toHaveBeenNthCalledWith(1, { method: 'POST', url: '/api/v1/properties', data: body });
    expect(request).toHaveBeenNthCalledWith(2, { method: 'POST', url: '/api/v1/properties', data: { ...body, id: 'p-1' } });
  });

  it('deletes with DELETE /api/v1/properties/{id}', async () => {
    request.mockResolvedValue(null);
    await propertyApi.remove('p-1', 'api');
    expect(request).toHaveBeenCalledWith({ method: 'DELETE', url: '/api/v1/properties/p-1' });
  });

  it('surfaces a contract error when the list is not an array', async () => {
    request.mockResolvedValue({ results: [] });
    await expect(propertyApi.list('api')).rejects.toMatchObject({ kind: 'contract' });
  });
});

describe('preview source', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    previewPropertyStore.reset();
  });
  afterEach(() => jest.useRealTimers());

  const settle = async <T,>(p: Promise<T>) => {
    await jest.advanceTimersByTimeAsync(PREVIEW_LATENCY_MS);
    return p;
  };

  it('never calls the server and starts empty', async () => {
    expect(await settle(propertyApi.list('preview'))).toEqual([]);
    previewPropertyStore.addSamples(2);
    const list = await settle(propertyApi.list('preview'));
    expect(list.map((p) => p.name)).toEqual(['Sample Property 1 (preview)', 'Sample Property 2 (preview)']);
    expect(list[0]!.tenantId).toBe(PREVIEW_TENANT_ID);
    expect(request).not.toHaveBeenCalled();
  });

  it('supports create, update, delete and a simulated failure', async () => {
    await settle(propertyApi.save({ ...body, tenant_id: PREVIEW_TENANT_ID }, 'preview'));
    const created = (await settle(propertyApi.list('preview')))[0]!;
    await settle(propertyApi.save({ ...body, tenant_id: PREVIEW_TENANT_ID, id: created.id, property_name: 'Renamed' }, 'preview'));
    expect((await settle(propertyApi.get(created.id, 'preview'))).name).toBe('Renamed');
    previewPropertyStore.failNextRequest();
    await expect(settle(propertyApi.list('preview'))).rejects.toMatchObject({ kind: 'server' });
    await settle(propertyApi.remove(created.id, 'preview'));
    expect(await settle(propertyApi.list('preview'))).toEqual([]);
  });
});
