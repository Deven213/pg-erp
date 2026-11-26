import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '@/screens/auth/LoginScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Only email + password login exists in the API (v0.1.0). The wireframe's mobile/OTP,
 * registration and forgot-password screens are added here when their endpoints ship.
 */
export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
