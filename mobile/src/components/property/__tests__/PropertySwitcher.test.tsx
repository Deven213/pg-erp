import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n';
import { PropertySwitcher, SWITCHER_SEARCH_THRESHOLD, type PropertyOption } from '../PropertySwitcher';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const options = (n: number): PropertyOption[] => Array.from({ length: n }, (_, i) => ({ id: `p-${i + 1}`, name: `Test Property ${i + 1}`, subtitle: i === 0 ? 'Vadodara' : 'Surat' }));

async function renderSwitcher(props: Partial<Parameters<typeof PropertySwitcher>[0]> & { properties: PropertyOption[] }) {
  const onChange = jest.fn();
  const onAddProperty = jest.fn();
  const result = await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <PropertySwitcher scope="all" onChange={onChange} onAddProperty={onAddProperty} {...props} />
    </SafeAreaProvider>,
  );
  return { onChange, onAddProperty, result };
}

describe('PropertySwitcher', () => {
  it('is hidden for owners with fewer than two properties', async () => {
    await renderSwitcher({ properties: options(1) });
    expect(screen.queryByTestId('property-switcher')).toBeNull();
  });

  it('shows All Properties with a count and switches to one property', async () => {
    const { onChange } = await renderSwitcher({ properties: options(3) });
    expect(screen.getByText('All Properties · 3')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('property-switcher'));
    await fireEvent.press(screen.getByTestId('switcher-option-p-2'));
    expect(onChange).toHaveBeenCalledWith('p-2');
  });

  it('shows the selected property name and can go back to All Properties', async () => {
    const { onChange } = await renderSwitcher({ properties: options(3), scope: 'p-3' });
    expect(screen.getByLabelText('Switch property: Test Property 3')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('property-switcher'));
    await fireEvent.press(screen.getByTestId('switcher-all'));
    expect(onChange).toHaveBeenCalledWith('all');
  });

  it(`adds search from ${SWITCHER_SEARCH_THRESHOLD} properties`, async () => {
    await renderSwitcher({ properties: options(SWITCHER_SEARCH_THRESHOLD - 1) });
    await fireEvent.press(screen.getByTestId('property-switcher'));
    expect(screen.queryByTestId('switcher-search')).toBeNull();
  });

  it('filters by name or city', async () => {
    await renderSwitcher({ properties: options(SWITCHER_SEARCH_THRESHOLD) });
    await fireEvent.press(screen.getByTestId('property-switcher'));
    await fireEvent.changeText(screen.getByTestId('switcher-search'), 'vadodara');
    expect(screen.getByTestId('switcher-option-p-1')).toBeTruthy();
    expect(screen.queryByTestId('switcher-option-p-2')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('switcher-search'), 'zzz');
    expect(screen.getByText('No properties match your search.')).toBeTruthy();
  });

  it('offers Add property from the sheet', async () => {
    const { onAddProperty } = await renderSwitcher({ properties: options(2) });
    await fireEvent.press(screen.getByTestId('property-switcher'));
    await fireEvent.press(screen.getByLabelText('Add property'));
    expect(onAddProperty).toHaveBeenCalled();
  });
});
