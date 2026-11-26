import { occupancyRate, summarize } from '../inventory';

const raw = {
  buildings: [
    { id: 'b1', property_id: 'p1' },
    { id: 'b2', property_id: 'p2' },
  ],
  floors: [
    { id: 'f1', building_id: 'b1' },
    { id: 'f2', building_id: 'b2' },
  ],
  rooms: [
    { id: 'r1', floor_id: 'f1' },
    { id: 'r2', floor_id: 'f2' },
  ],
  beds: [
    { id: 'k1', room_id: 'r1', status: 'occupied' },
    { id: 'k2', room_id: 'r1', status: 'available' },
    { id: 'k3', room_id: 'r2', status: 'inactive' },
    { id: 'k4', room_id: 'r2', status: 'occupied' },
    { id: 'k5', room_id: 'r2', status: 'something-new' },
  ],
};

describe('inventory summary', () => {
  it('rolls beds up to their property through room → floor → building', () => {
    const s = summarize(raw);
    expect(s.total).toMatchObject({ buildings: 2, rooms: 2, beds: 5, occupied: 2, available: 1, inactive: 1 });
    expect(s.byProperty.p1).toMatchObject({ buildings: 1, rooms: 1, beds: 2, occupied: 1, available: 1 });
    expect(s.byProperty.p2).toMatchObject({ beds: 3, occupied: 1, inactive: 1 });
  });

  it('ignores undocumented bed statuses in the status counts', () => {
    const s = summarize(raw);
    const counted = s.total.available + s.total.occupied + s.total.reserved + s.total.maintenance + s.total.inactive;
    expect(counted).toBe(4);
  });

  it('computes occupancy over usable (non-inactive) beds', () => {
    const s = summarize(raw);
    expect(occupancyRate(s.byProperty.p2!)).toBe(0.5);
    expect(occupancyRate({ buildings: 0, rooms: 0, beds: 0, available: 0, occupied: 0, reserved: 0, maintenance: 0, inactive: 0 })).toBeNull();
  });

  it('throws a contract error when a list is not in the expected shape', () => {
    expect(() => summarize({ ...raw, beds: { items: [] } })).toThrow(expect.objectContaining({ kind: 'contract' }));
    expect(() => summarize({ ...raw, rooms: [{ id: 'r1' }] })).toThrow(expect.objectContaining({ kind: 'contract' }));
  });
});
