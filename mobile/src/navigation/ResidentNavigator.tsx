import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { House, IndianRupee, Megaphone, User, Wrench } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ResidentTabRootScreen } from '@/screens/resident/ResidentTabRootScreen';
import { tabIcon, tabScreenOptions } from './tabBarOptions';
import type { ResidentStackParamList, ResidentTabParamList } from './types';

const Tab = createBottomTabNavigator<ResidentTabParamList>();
const Stack = createNativeStackNavigator<ResidentStackParamList>();

/** Resident bottom navigation from the wireframe: Home · Rent · Complaints · Notices · Profile. */
function ResidentTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="ResidentHome" options={{ title: t('nav.home'), tabBarIcon: tabIcon(House) }}>
        {() => <ResidentTabRootScreen moduleKey="home" title={t('nav.home')} />}
      </Tab.Screen>
      <Tab.Screen name="ResidentRent" options={{ title: t('nav.rent'), tabBarIcon: tabIcon(IndianRupee) }}>
        {() => <ResidentTabRootScreen moduleKey="rent" title={t('nav.rent')} />}
      </Tab.Screen>
      <Tab.Screen name="ResidentComplaints" options={{ title: t('nav.complaints'), tabBarIcon: tabIcon(Wrench) }}>
        {() => <ResidentTabRootScreen moduleKey="complaints" title={t('nav.complaints')} />}
      </Tab.Screen>
      <Tab.Screen name="ResidentNotices" options={{ title: t('nav.notices'), tabBarIcon: tabIcon(Megaphone) }}>
        {() => <ResidentTabRootScreen moduleKey="notices" title={t('nav.notices')} />}
      </Tab.Screen>
      <Tab.Screen name="ResidentProfile" options={{ title: t('nav.profile'), tabBarIcon: tabIcon(User) }}>
        {() => <ResidentTabRootScreen moduleKey="profile" title={t('nav.profile')} showLogout />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function ResidentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ResidentTabs" component={ResidentTabs} />
    </Stack.Navigator>
  );
}
