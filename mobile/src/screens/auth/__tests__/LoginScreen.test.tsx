import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n';
import { useSession } from '@/auth/session';
import { LoginScreen } from '../LoginScreen';

const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

let qc: QueryClient;
afterEach(() => qc?.clear());

async function renderLogin() {
  // gcTime 0 so no cache timers outlive the test.
  qc = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 }, queries: { gcTime: 0 } } });
  return await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={qc}>
        <LoginScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

describe('LoginScreen', () => {
  it('validates before calling the API', async () => {
    const login = jest.fn();
    useSession.setState({ login });
    await renderLogin();
    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(await screen.findAllByText('This field is required')).toHaveLength(2);
    expect(login).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', async () => {
    useSession.setState({ login: jest.fn() });
    await renderLogin();
    await fireEvent.changeText(screen.getByTestId('login-email'), 'dev@');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'secret');
    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
  });

  it('sends trimmed credentials matching LoginRequest', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    useSession.setState({ login });
    await renderLogin();
    await fireEvent.changeText(screen.getByTestId('login-email'), '  owner@example.com ');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'secret');
    await fireEvent.press(screen.getByTestId('login-submit'));
    await waitFor(() => expect(login).toHaveBeenCalledWith({ email: 'owner@example.com', password: 'secret' }));
  });
});
