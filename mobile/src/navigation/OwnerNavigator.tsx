import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Building, House, IndianRupee, LayoutGrid, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { OwnerDashboardScreen } from '@/screens/owner/OwnerDashboardScreen';
import { OwnerModuleScreen } from '@/screens/owner/OwnerModuleScreen';
import { OwnerMoreScreen } from '@/screens/owner/OwnerMoreScreen';
import { OwnerTabRootScreen } from '@/screens/owner/OwnerTabRootScreen';
import { PropertyDetailsScreen } from '@/screens/owner/properties/PropertyDetailsScreen';
import { PropertyFormScreen } from '@/screens/owner/properties/PropertyFormScreen';
import { PropertyListScreen } from '@/screens/owner/properties/PropertyListScreen';
import { tabIcon, tabScreenOptions } from './tabBarOptions';
import type { OwnerStackParamList, OwnerTabParamList } from './types';

const Tab = createBottomTabNavigator<OwnerTabParamList>();
const Stack = createNativeStackNavigator<OwnerStackParamList>();

/** Owner bottom navigation from the wireframe: Home · Properties · Residents · Finance · More. */
function OwnerTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="OwnerHome" component={OwnerDashboardScreen} options={{ title: t('nav.home'), tabBarIcon: tabIcon(House) }} />
      <Tab.Screen name="OwnerProperties" component={PropertyListScreen} options={{ title: t('nav.properties'), tabBarIcon: tabIcon(Building) }} />
      <Tab.Screen name="OwnerResidents" options={{ title: t('nav.residents'), tabBarIcon: tabIcon(Users) }}>
        {() => <OwnerTabRootScreen moduleKey="residents" title={t('nav.residents')} />}
      </Tab.Screen>
      <Tab.Screen name="OwnerFinance" options={{ title: t('nav.finance'), tabBarIcon: tabIcon(IndianRupee) }}>
        {() => <OwnerTabRootScreen moduleKey="finance" title={t('nav.finance')} />}
      </Tab.Screen>
      <Tab.Screen name="OwnerMore" component={OwnerMoreScreen} options={{ title: t('nav.more'), tabBarIcon: tabIcon(LayoutGrid) }} />
    </Tab.Navigator>
  );
}

/** Tabs at the root; detail screens, forms and workflows are pushed on this stack above the tab bar. */
export function OwnerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerTabs" component={OwnerTabs} />
      <Stack.Screen name="OwnerModule" component={OwnerModuleScreen} />
      <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
      <Stack.Screen name="PropertyForm" component={PropertyFormScreen} />
    </Stack.Navigator>
  );
}
