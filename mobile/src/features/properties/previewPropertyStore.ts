/**
 * DEVELOPMENT-ONLY property data for the UI preview (see src/dev/uiPreview.ts).
 *
 * Lets the property screens be exercised (add, edit, delete, switch) before a real Owner login exists.
 * - Used only while UI preview is active, which itself requires __DEV__ and EXPO_PUBLIC_ENABLE_UI_PREVIEW=true.
 * - Lives in memory only; never sent to the server; cleared when the preview ends.
 * - Starts EMPTY. Sample records are added only when the developer asks, and are visibly labelled as samples.
 * The record shape mirrors PropertyUpsert field names — it is NOT evidence of the real response shape.
 */
import { ApiError } from '@/api/errors';
import type { PropertyUpsert } from '@/api/types/models';

/** Placeholder business id used only in preview (PropertyUpsert.tenant_id is required). */
export const PREVIEW_TENANT_ID = '00000000-0000-4000-8000-000000000000';

type PreviewRecord = Required<Omit<PropertyUpsert, 'id'>> & { id: string };

let records: PreviewRecord[] = [];
let failNext = false;
let counter = 0;

/** Sample structure for preview samples only, using the documented parent-id field names. */
type Structure = {
  buildings: { id: string; property_id: string }[];
  floors: { id: string; building_id: string }[];
  rooms: { id: string; floor_id: string }[];
  beds: { id: string; room_id: string; status: string }[];
};
let structure: Structure = { buildings: [], floors: [], rooms: [], beds: [] };
const SAMPLE_BED_PATTERN = ['occupied', 'occupied', 'available', 'occupied', 'reserved', 'occupied', 'maintenance', 'occupied', 'available', 'occupied', 'occupied', 'occupied'];

function addSampleStructure(propertyId: string, seed: number) {
  const b = { id: `${propertyId}-b1`, property_id: propertyId };
  structure.buildings.push(b);
  for (let f = 1; f <= 2; f += 1) {
    const floor = { id: `${b.id}-f${f}`, building_id: b.id };
    structure.floors.push(floor);
    for (let r = 1; r <= 4; r += 1) {
      const room = { id: `${floor.id}-r${r}`, floor_id: floor.id };
      structure.rooms.push(room);
      for (let k = 1; k <= 3; k += 1) {
        const i = (seed * 5 + f * 7 + r * 3 + k) % SAMPLE_BED_PATTERN.length;
        structure.beds.push({ id: `${room.id}-k${k}`, room_id: room.id, status: SAMPLE_BED_PATTERN[i]! });
      }
    }
  }
}

function removeStructure(propertyId: string) {
  const bIds = new Set(structure.buildings.filter((b) => b.property_id === propertyId).map((b) => b.id));
  const fIds = new Set(structure.floors.filter((f) => bIds.has(f.building_id)).map((f) => f.id));
  const rIds = new Set(structure.rooms.filter((r) => fIds.has(r.floor_id)).map((r) => r.id));
  structure = {
    buildings: structure.buildings.filter((b) => !bIds.has(b.id)),
    floors: structure.floors.filter((f) => !fIds.has(f.id)),
    rooms: structure.rooms.filter((r) => !rIds.has(r.id)),
    beds: structure.beds.filter((b) => !rIds.has(b.room_id)),
  };
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Simulated network time so loading states are visible in preview. */
export const PREVIEW_LATENCY_MS = 450;

function nextId(): string {
  counter += 1;
  return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
}

async function respond<T>(fn: () => T): Promise<T> {
  await delay(PREVIEW_LATENCY_MS);
  if (failNext) {
    failNext = false;
    throw new ApiError('server', { status: 500 });
  }
  return fn();
}

export const previewPropertyStore = {
  list: () => respond(() => records.map((r) => ({ ...r }))),
  getById: (id: string) => respond(() => records.filter((r) => r.id === id).map((r) => ({ ...r }))),
  save: (body: PropertyUpsert) =>
    respond(() => {
      const full: PreviewRecord = {
        id: body.id ?? nextId(),
        tenant_id: body.tenant_id,
        property_name: body.property_name,
        property_code: body.property_code,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        property_type: body.property_type,
        description: body.description ?? null,
        image_url: body.image_url ?? null,
        status: body.status ?? 'active',
      };
      const i = records.findIndex((r) => r.id === full.id);
      if (body.id && i < 0) throw new ApiError('notFound', { status: 404 });
      if (i >= 0) records[i] = full;
      else records.push(full);
      return { ...full };
    }),
  remove: (id: string) =>
    respond(() => {
      const before = records.length;
      records = records.filter((r) => r.id !== id);
      if (records.length === before) throw new ApiError('notFound', { status: 404 });
      removeStructure(id);
      return null;
    }),
  /** Buildings/floors/rooms/beds lists, shaped like the documented *Upsert schemas. */
  inventory: () => respond(() => ({ buildings: [...structure.buildings], floors: [...structure.floors], rooms: [...structure.rooms], beds: [...structure.beds] })),

  // ---- developer tools (preview only) ----
  /** Adds clearly-labelled sample properties. */
  addSamples(count = 3) {
    for (let n = 0; n < count; n += 1) {
      const k = records.length + 1;
      const id = nextId();
      // Every other sample gets rooms and beds, so both "set up" and "not set up yet" states are visible.
      if (k % 3 !== 0) addSampleStructure(id, k);
      records.push({
        id,
        tenant_id: PREVIEW_TENANT_ID,
        property_name: `Sample Property ${k} (preview)`,
        property_code: `SAMPLE-${k}`,
        address: 'Sample address — preview data only',
        city: 'Sample City',
        state: 'Sample State',
        pincode: '100001',
        property_type: 'Sample',
        description: 'Development preview record. Not real data and never sent to the server.',
        image_url: null,
        status: 'active',
      });
    }
  },
  /** The next preview request fails with a server error, to check error states. */
  failNextRequest() {
    failNext = true;
  },
  reset() {
    records = [];
    structure = { buildings: [], floors: [], rooms: [], beds: [] };
    failNext = false;
    counter = 0;
  },
  count: () => records.length,
};
