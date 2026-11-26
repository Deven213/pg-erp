import type { ComponentType } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n';
import { apiRequest } from '@/api/client';
import { ApiError } from '@/api/errors';
import { useSession } from '@/auth/session';
import type { OwnerStackParamList } from '@/navigation/types';
import { ToastProvider } from '@/providers/ToastProvider';
import { OwnerDashboardScreen } from '@/screens/owner/OwnerDashboardScreen';
import { OwnerTabRootScreen } from '@/screens/owner/OwnerTabRootScreen';
import { usePropertyContext } from '@/store/propertyContext';
import { realResponses } from '@/test-utils/apiResponses';
import { PropertyDetailsScreen } from '../PropertyDetailsScreen';
import { PropertyFormScreen } from '../PropertyFormScreen';
import { PropertyListScreen } from '../PropertyListScreen';

jest.mock('@/api/client', () => ({ apiRequest: jest.fn(), configureAuthBridge: jest.fn() }));
jest.mock('@/auth/tokenStorage', () => ({
  tokenStorage: {
    getPropertyScope: jest.fn(async () => null),
    setPropertyScope: jest.fn(async () => undefined),
    getRefreshToken: jest.fn(async () => null),
    getRole: jest.fn(async () => null),
    setRefreshToken: jest.fn(),
    setRole: jest.fn(),
    clear: jest.fn(async () => undefined),
  },
}));

/*
 * Screen + navigation tests. The HTTP layer (apiRequest) is replaced by an in-memory backend that follows
 * the documented endpoints; records use PropertyUpsert field names (the real response shape is unverified).
 */
const request = apiRequest as jest.Mock;
const TENANT = '3f2b8c1e-0d4a-4c3b-9a51-2e7f6d8c9b10';
type Row = Record<string, unknown> & { id: string };
const row = (n: number, extra: Partial<Row> = {}): Row => ({
  id: `p-${n}`,
  tenant_id: TENANT,
  property_name: `Test Property ${n}`,
  property_code: `TP-${n}`,
  address: `${n} Test Street`,
  city: n === 1 ? 'Vadodara' : 'Surat',
  state: 'Gujarat',
  pincode: '390001',
  property_type: 'Boys PG',
  description: null,
  image_url: null,
  status: 'active',
  ...extra,
});

let db: Row[] = [];
/** Structure lists shaped like the documented *Upsert schemas: p-1 has 1 building, 1 floor, 2 rooms, 4 beds. */
let inventory: Record<string, unknown[]> = {};
const sampleInventory = () => ({
  '/api/v1/buildings': [{ id: 'b-1', property_id: 'p-1' }],
  '/api/v1/floors': [{ id: 'f-1', building_id: 'b-1' }],
  '/api/v1/rooms': [
    { id: 'r-1', floor_id: 'f-1' },
    { id: 'r-2', floor_id: 'f-1' },
  ],
  '/api/v1/beds': [
    { id: 'k-1', room_id: 'r-1', status: 'occupied' },
    { id: 'k-2', room_id: 'r-1', status: 'occupied' },
    { id: 'k-3', room_id: 'r-2', status: 'occupied' },
    { id: 'k-4', room_id: 'r-2', status: 'maintenance' },
  ],
});
let posted: unknown[] = [];
let deleted: string[] = [];
let failNext: ApiError | null = null;
let nextId = 100;

function backend() {
  request.mockImplementation(async (config: { method: string; url: string; params?: { id?: string }; data?: Row }) => {
    if (failNext) {
      const e = failNext;
      failNext = null;
      throw e;
    }
    if (config.method === 'GET' && config.url === '/api/v1/properties') {
      return config.params?.id ? db.filter((r) => r.id === config.params?.id) : db.map((r) => ({ ...r }));
    }
    if (config.method === 'POST' && config.url === '/api/v1/properties') {
      posted.push(config.data);
      const body = config.data as Row;
      if (body.id) db = db.map((r) => (r.id === body.id ? { ...r, ...body } : r));
      else db.push({ ...body, id: `p-${nextId++}`, status: 'active' });
      return null;
    }
    if (config.method === 'DELETE' && config.url.startsWith('/api/v1/properties/')) {
      const id = config.url.split('/').pop()!;
      deleted.push(id);
      db = db.filter((r) => r.id !== id);
      return null;
    }
    if (config.method === 'GET' && config.url in inventory) return inventory[config.url];
    throw new Error(`Undocumented call ${config.method} ${config.url}`);
  });
}

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const Stack = createNativeStackNavigator<OwnerStackParamList>();
const Home = () => <OwnerTabRootScreen moduleKey="dashboard" title="Home" />;
let qc: QueryClient;

async function renderApp(start: ComponentType = PropertyListScreen) {
  qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  return await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
              <Stack.Screen name="OwnerTabs" component={start as ComponentType<object>} />
              <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
              <Stack.Screen name="PropertyForm" component={PropertyFormScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  db = [row(1), row(2)];
  inventory = sampleInventory();
  posted = [];
  deleted = [];
  failNext = null;
  nextId = 100;
  backend();
  useSession.setState({ tenantId: TENANT });
  usePropertyContext.setState({ scope: 'all', hydrated: true });
});
afterEach(() => qc?.clear());

describe('Property list', () => {
  it('shows loading, then every property with code, city and type', async () => {
    await renderApp();
    expect(screen.getByTestId('loading-state')).toBeTruthy();
    expect(await screen.findByText('Test Property 1')).toBeTruthy();
    expect(screen.getByText('Test Property 2')).toBeTruthy();
    expect(screen.getByText('Vadodara, Gujarat')).toBeTruthy();
    expect(screen.getAllByText('Boys PG').length).toBe(2);
    expect(screen.getByText('TP-1')).toBeTruthy();
    // Occupancy from GET /beds etc.: p-1 has 3 of 4 beds occupied; p-2 has none set up.
    expect(await screen.findByText('3 of 4 beds occupied')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('Rooms and beds not set up yet')).toBeTruthy();
    expect(screen.getByText('2 properties')).toBeTruthy();
  });

  it('shows the empty state with an Add action that opens the form', async () => {
    db = [];
    await renderApp();
    expect(await screen.findByText('Start managing your PG')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Add Your First Property' }));
    expect(await screen.findByTestId('property-form-screen')).toBeTruthy();
  });

  it('shows an error with retry, then recovers', async () => {
    failNext = new ApiError('server', { status: 500 });
    await renderApp();
    expect(await screen.findByText("Couldn't load your properties")).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Test Property 1')).toBeTruthy();
  });

  it('shows a contract error rather than guessing when the response shape is unexpected', async () => {
    request.mockResolvedValueOnce({ items: [] });
    await renderApp();
    expect(await screen.findByText("The app couldn't read the server's response. Please update the app or contact support.")).toBeTruthy();
  });

  it('searches once there are six or more properties', async () => {
    db = [1, 2, 3, 4, 5, 6].map((n) => row(n));
    await renderApp();
    await screen.findByText('Test Property 6');
    await fireEvent.changeText(screen.getByTestId('property-search'), 'vadodara');
    expect(screen.getByText('Test Property 1')).toBeTruthy();
    expect(screen.queryByText('Test Property 2')).toBeNull();
  });

  it('opens details when a property is pressed', async () => {
    await renderApp();
    await fireEvent.press(await screen.findByTestId('property-row-p-2'));
    const details = await screen.findByTestId('property-details-screen');
    expect(await within(details).findByText('2 Test Street, Surat, Gujarat, 390001')).toBeTruthy();
  });
});

describe('Property details', () => {
  it('makes the property the current context for the whole app', async () => {
    await renderApp();
    await fireEvent.press(await screen.findByTestId('property-row-p-1'));
    await fireEvent.press(await screen.findByTestId('make-current'));
    expect(usePropertyContext.getState().scope).toBe('p-1');
    expect(await screen.findByText(/The whole Owner app is showing this property/)).toBeTruthy();
  });

  it('deletes only after confirmation and clears it from the context', async () => {
    usePropertyContext.setState({ scope: 'p-1' });
    await renderApp();
    await fireEvent.press(await screen.findByTestId('property-row-p-1'));
    await fireEvent.press(await screen.findByTestId('delete-property'));
    expect(screen.getByText('Delete Test Property 1?')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(deleted).toEqual([]);

    await fireEvent.press(screen.getByTestId('delete-property'));
    const confirm = screen.getAllByRole('button', { name: 'Delete property' });
    await fireEvent.press(confirm[confirm.length - 1]!);
    await waitFor(() => expect(deleted).toEqual(['p-1']));
    expect(await screen.findByText('Test Property 1 deleted')).toBeTruthy();
    await waitFor(() => expect(screen.queryByTestId('property-details-screen')).toBeNull());
    expect(usePropertyContext.getState().scope).toBe('all');
    await waitFor(() => expect(screen.queryByText('Test Property 1')).toBeNull());
  });

  it('keeps the property and reports the error when delete fails', async () => {
    await renderApp();
    await fireEvent.press(await screen.findByTestId('property-row-p-2'));
    await fireEvent.press(await screen.findByTestId('delete-property'));
    failNext = new ApiError('forbidden', { status: 403, serverMessage: 'You cannot delete this property.' });
    const confirm = screen.getAllByRole('button', { name: 'Delete property' });
    await fireEvent.press(confirm[confirm.length - 1]!);
    expect(await screen.findByText('You cannot delete this property.')).toBeTruthy();
    expect(screen.getByTestId('property-details-screen')).toBeTruthy();
    expect(db).toHaveLength(2);
  });

  it('shows not found when the property no longer exists', async () => {
    await renderApp();
    await screen.findByText('Test Property 1');
    db = db.filter((r) => r.id !== 'p-1');
    await fireEvent.press(screen.getByTestId('property-row-p-1'));
    expect(await screen.findByText("We couldn't find what you were looking for.")).toBeTruthy();
  });
});

describe('Add property form', () => {
  async function openAdd() {
    await renderApp();
    await screen.findByText('Test Property 1');
    await fireEvent.press(screen.getByTestId('header-add-property'));
    await screen.findByTestId('property-form-screen');
  }

  it('validates required fields and does not call the API', async () => {
    await openAdd();
    await fireEvent.press(screen.getByTestId('property-submit'));
    expect((await screen.findAllByText('This field is required')).length).toBeGreaterThanOrEqual(6);
    expect(screen.getByText('PIN code must be 6 digits')).toBeTruthy();
    expect(screen.getByText('Please fix the highlighted fields')).toBeTruthy();
    expect(posted).toEqual([]);
  });

  it('creates a property with the documented fields and returns to the refreshed list', async () => {
    await openAdd();
    await fireEvent.changeText(screen.getByTestId('field-name'), ' New Test PG ');
    await fireEvent.changeText(screen.getByTestId('field-code'), 'NTP-1');
    await fireEvent.press(screen.getByRole('radio', { name: 'Girls PG' }));
    await fireEvent.changeText(screen.getByTestId('field-address'), '5 Test Road');
    await fireEvent.changeText(screen.getByTestId('field-city'), 'Surat');
    await fireEvent.changeText(screen.getByTestId('field-pincode'), '395001');
    await fireEvent.changeText(screen.getByTestId('field-state'), 'Gujarat');
    await fireEvent.press(screen.getByTestId('property-submit'));

    await waitFor(() =>
      expect(posted).toEqual([
        {
          tenant_id: TENANT,
          property_name: 'New Test PG',
          property_code: 'NTP-1',
          address: '5 Test Road',
          city: 'Surat',
          state: 'Gujarat',
          pincode: '395001',
          property_type: 'Girls PG',
          description: null,
        },
      ]),
    );
    expect(await screen.findByText('New Test PG added')).toBeTruthy();
    await waitFor(() => expect(screen.queryByTestId('property-form-screen')).toBeNull());
    expect(await screen.findByText('New Test PG')).toBeTruthy();
  });

  it('shows the server message when the API rejects the data', async () => {
    await openAdd();
    const values: [string, string][] = [['name', 'X'], ['code', 'TP-1'], ['type', 'Boys PG'], ['address', 'a'], ['city', 'c'], ['pincode', '390001'], ['state', 's']];
    for (const [f, v] of values) {
      await fireEvent.changeText(screen.getByTestId(`field-${f}`), v);
    }
    failNext = new ApiError('validation', { status: 422, serverMessage: realResponses.validation422.errorMessage });
    await fireEvent.press(screen.getByTestId('property-submit'));
    expect(await screen.findByText('Please check the request data and try again.')).toBeTruthy();
    expect(screen.getByTestId('property-form-screen')).toBeTruthy();
  });

  it('is blocked, with an explanation, when the business id is unknown', async () => {
    useSession.setState({ tenantId: null });
    db = [row(1, { tenant_id: null }), row(2, { tenant_id: null })];
    await openAdd();
    expect(await screen.findByTestId('no-tenant-banner')).toBeTruthy();
    expect(screen.getByTestId('property-submit').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('uses the business id shared by existing properties when the session has none', async () => {
    useSession.setState({ tenantId: null });
    await openAdd();
    expect(screen.queryByTestId('no-tenant-banner')).toBeNull();
  });

  it('asks before discarding typed changes', async () => {
    await openAdd();
    await fireEvent.changeText(screen.getByTestId('field-name'), 'Half typed');
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(await screen.findByText('Discard changes?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByTestId('property-form-screen')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(screen.queryByTestId('property-form-screen')).toBeNull());
    expect(posted).toEqual([]);
  });
});

describe('Edit property form', () => {
  it('prefills from the server and sends the full record with its id, status and image', async () => {
    db = [row(1, { status: 'inactive', image_url: 'https://example.com/p1.jpg', description: 'Old notes' }), row(2)];
    await renderApp();
    await fireEvent.press(await screen.findByTestId('property-row-p-1'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Edit property' }));
    expect((await screen.findByTestId('field-name')).props.value).toBe('Test Property 1');
    expect(screen.getByTestId('field-description').props.value).toBe('Old notes');
    await fireEvent.changeText(screen.getByTestId('field-name'), 'Renamed Property');
    await fireEvent.press(screen.getByTestId('property-submit'));
    await waitFor(() =>
      expect(posted[0]).toEqual({
        id: 'p-1',
        tenant_id: TENANT,
        property_name: 'Renamed Property',
        property_code: 'TP-1',
        address: '1 Test Street',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390001',
        property_type: 'Boys PG',
        description: 'Old notes',
        image_url: 'https://example.com/p1.jpg',
        status: 'inactive',
      }),
    );
    const details = await screen.findByTestId('property-details-screen');
    expect((await within(details).findAllByText('Renamed Property')).length).toBeGreaterThan(0);
  });
});

describe('Owner dashboard', () => {
  it('shows real totals and occupancy, and no made-up resident or rent numbers', async () => {
    await renderApp(OwnerDashboardScreen);
    expect(await screen.findByLabelText('Occupancy 75%')).toBeTruthy();
    expect(screen.getByText('3 of 4 beds occupied')).toBeTruthy();
    expect(within(screen.getByTestId('stat-properties')).getByText('2')).toBeTruthy();
    expect(within(screen.getByTestId('stat-rooms')).getByText('2')).toBeTruthy();
    expect(within(screen.getByTestId('stat-beds')).getByText('4')).toBeTruthy();
    expect(within(screen.getByTestId('stat-vacant')).getByText('0')).toBeTruthy();
    for (const label of ['Active residents', 'Pending rent', 'Collected this month']) {
      expect(screen.getByLabelText(`${label}: not available`)).toBeTruthy();
    }
    expect(screen.getByText('1 bed under maintenance')).toBeTruthy();
    expect(screen.getByText('1 property has no beds set up')).toBeTruthy();
  });

  it('follows the selected property', async () => {
    await renderApp(OwnerDashboardScreen);
    await screen.findByLabelText('Occupancy 75%');
    await fireEvent.press(screen.getByTestId('property-switcher'));
    await fireEvent.press(screen.getByTestId('switcher-option-p-2'));
    expect(await screen.findByText('Add rooms and beds to see occupancy')).toBeTruthy();
    expect(within(screen.getByTestId('stat-properties')).getByText('1')).toBeTruthy();
  });

  it('keeps working when room and bed data cannot be loaded', async () => {
    inventory = {};
    await renderApp(OwnerDashboardScreen);
    expect(await screen.findByText('Room and bed data couldn’t be loaded'.replace('’', "'"))).toBeTruthy();
    expect(screen.getByLabelText('Beds: not available')).toBeTruthy();
    expect(screen.getByLabelText('Pending rent: not available')).toBeTruthy();
    expect(within(screen.getByTestId('stat-properties')).getByText('2')).toBeTruthy();
  });

  it('guides a new owner to add the first property', async () => {
    db = [];
    await renderApp(OwnerDashboardScreen);
    expect(await screen.findByText('Start managing your PG')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Add Your First Property' }));
    expect(await screen.findByTestId('property-form-screen')).toBeTruthy();
  });
});

describe('Property context across the Owner app', () => {
  it('shows the switcher on other Owner tabs and follows the selection', async () => {
    await renderApp(Home);
    expect(await screen.findByText('Showing: All Properties')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('property-switcher'));
    await fireEvent.press(screen.getByTestId('switcher-option-p-2'));
    expect(await screen.findByText('Showing: Test Property 2')).toBeTruthy();
    expect(usePropertyContext.getState().scope).toBe('p-2');
  });

  it('falls back to All Properties when the saved property no longer exists', async () => {
    usePropertyContext.setState({ scope: 'p-deleted' });
    await renderApp(Home);
    expect(await screen.findByText('Showing: All Properties')).toBeTruthy();
    await waitFor(() => expect(usePropertyContext.getState().scope).toBe('all'));
  });
});
