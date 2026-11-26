import type { NavigatorScreenParams } from '@react-navigation/native';

import type { ownerModules, residentModules } from '@/constants/modules';

export type OwnerModuleKey = keyof typeof ownerModules;
export type ResidentModuleKey = keyof typeof residentModules;

export type AuthStackParamList = {
  Login: undefined;
};

export type OwnerTabParamList = {
  OwnerHome: undefined;
  OwnerProperties: undefined;
  OwnerResidents: undefined;
  OwnerFinance: undefined;
  OwnerMore: undefined;
};

/** Owner detail screens, forms and workflows go here and open above the tabs. */
export type OwnerStackParamList = {
  OwnerTabs: NavigatorScreenParams<OwnerTabParamList>;
  OwnerModule: { moduleKey: OwnerModuleKey };
  PropertyDetails: { propertyId: string };
  /** Without propertyId → Add property; with it → Edit property. */
  PropertyForm: { propertyId?: string };
};

export type ResidentTabParamList = {
  ResidentHome: undefined;
  ResidentRent: undefined;
  ResidentComplaints: undefined;
  ResidentNotices: undefined;
  ResidentProfile: undefined;
};

export type ResidentStackParamList = {
  ResidentTabs: NavigatorScreenParams<ResidentTabParamList>;
  ResidentModule: { moduleKey: ResidentModuleKey };
};
