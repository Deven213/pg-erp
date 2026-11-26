import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { LucideIcon } from 'lucide-react-native';

import { colors, fontFamily } from '@/theme';

/**
 * Shared bottom bar. Height and the Android navigation-bar inset are left to React Navigation so
 * icons and labels are never clipped; only colours and type are set here.
 */
export const tabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.brand,
  tabBarInactiveTintColor: colors.ink2,
  tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.stroke, borderTopWidth: 1, elevation: 0 },
  tabBarLabelStyle: { fontFamily: fontFamily.semibold, fontSize: 11 },
  tabBarAllowFontScaling: false,
};

export function tabIcon(Icon: LucideIcon) {
  return function TabIcon({ color, focused }: { color: string; focused: boolean; size: number }) {
    return <Icon color={color} size={22} strokeWidth={focused ? 2.3 : 1.8} />;
  };
}
