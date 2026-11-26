/**
 * Occupancy summary built from the documented structure endpoints:
 *   GET /api/v1/buildings · /floors · /rooms · /beds
 * UNVERIFIED response shape: records are assumed to use the *Upsert field names
 * (id, property_id, building_id, floor_id, room_id, status). Anything else → 'contract' error,
 * and the dashboard shows "—" instead of a number.
 */
import { ApiError } from '@/api/errors';
import { bedsService, buildingsService, floorsService, roomsService } from '@/api/services/resources';
import { BED_STATUSES, type BedStatus } from '@/api/types/models';
import type { PropertySource } from '@/features/properties/propertyApi';
import { previewPropertyStore } from '@/features/properties/previewPropertyStore';

export type Stats = { buildings: number; rooms: number; beds: number } & Record<BedStatus, number>;
export type InventorySummary = { total: Stats; byProperty: Record<string, Stats> };

type Link = { id: string; parent: string };
type BedLink = Link & { status: BedStatus | null };

export const emptyStats = (): Stats => ({ buildings: 0, rooms: 0, beds: 0, available: 0, occupied: 0, reserved: 0, maintenance: 0, inactive: 0 });

function links(data: unknown, parentField: string): Link[] {
  if (!Array.isArray(data)) throw new ApiError('contract');
  return data.map((r) => {
    const rec = r as Record<string, unknown> | null;
    if (!rec || typeof rec.id !== 'string' || typeof rec[parentField] !== 'string') throw new ApiError('contract');
    return { id: rec.id, parent: rec[parentField] as string };
  });
}

function bedLinks(data: unknown): BedLink[] {
  const base = links(data, 'room_id');
  return base.map((b, i) => {
    const s = (data as Record<string, unknown>[])[i]!.status;
    return { ...b, status: typeof s === 'string' && (BED_STATUSES as readonly string[]).includes(s) ? (s as BedStatus) : null };
  });
}

/** Pure aggregation, exported for tests. */
export function summarize(raw: { buildings: unknown; floors: unknown; rooms: unknown; beds: unknown }): InventorySummary {
  const buildings = links(raw.buildings, 'property_id');
  const floors = links(raw.floors, 'building_id');
  const rooms = links(raw.rooms, 'floor_id');
  const beds = bedLinks(raw.beds);

  const propertyOfBuilding = new Map(buildings.map((b) => [b.id, b.parent]));
  const propertyOfFloor = new Map(floors.map((f) => [f.id, propertyOfBuilding.get(f.parent)]));
  const propertyOfRoom = new Map(rooms.map((r) => [r.id, propertyOfFloor.get(r.parent)]));

  const total = emptyStats();
  const byProperty: Record<string, Stats> = {};
  const bucket = (pid: string | undefined) => (pid ? (byProperty[pid] ??= emptyStats()) : null);

  for (const b of buildings) {
    total.buildings += 1;
    bucket(b.parent)!.buildings += 1;
  }
  for (const r of rooms) {
    total.rooms += 1;
    const s = bucket(propertyOfRoom.get(r.id));
    if (s) s.rooms += 1;
  }
  for (const bed of beds) {
    total.beds += 1;
    const s = bucket(propertyOfRoom.get(bed.parent));
    if (s) s.beds += 1;
    if (bed.status) {
      total[bed.status] += 1;
      if (s) s[bed.status] += 1;
    }
  }
  return { total, byProperty };
}

/** Share of usable beds (excluding inactive) that are occupied, or null when there are none. */
export function occupancyRate(s: Stats): number | null {
  const usable = s.beds - s.inactive;
  return usable > 0 ? s.occupied / usable : null;
}

export async function fetchInventory(source: PropertySource): Promise<InventorySummary> {
  if (source === 'preview') return summarize(await previewPropertyStore.inventory());
  const [buildings, floors, rooms, beds] = await Promise.all([buildingsService.list(), floorsService.list(), roomsService.list(), bedsService.list()]);
  return summarize({ buildings, floors, rooms, beds });
}
