import type { LucideIcon } from 'lucide-react-native';
import {
  BedDouble,
  Bell,
  Building,
  Calendar,
  FileText,
  House,
  IndianRupee,
  Inbox,
  Lock,
  Megaphone,
  Settings,
  Shield,
  Star,
  User,
  Users,
  Wrench,
  ChartColumn,
  Receipt,
  Tag,
  LifeBuoy,
} from 'lucide-react-native';

/** Backend readiness per module, from docs/API_ANALYSIS.md (OpenAPI v0.1.0). Update when endpoints ship. */
export type ApiStatus = 'available' | 'partial' | 'missing';

export type ModuleInfo = {
  key: string;
  title: string;
  icon: LucideIcon;
  apiStatus: ApiStatus;
  /** Short note on which endpoints exist or are missing. */
  apiNote: string;
};

export const ownerModules = {
  dashboard: { key: 'dashboard', title: 'Dashboard', icon: House, apiStatus: 'missing', apiNote: 'Needs occupancy, rent and expense summary endpoints.' },
  properties: { key: 'properties', title: 'Properties', icon: Building, apiStatus: 'partial', apiNote: '/properties CRUD used by the app (list, details, add, edit, delete). Response shape unverified. Missing: contact, amenities, photo upload, documents, rules.' },
  structure: { key: 'structure', title: 'Buildings, rooms & beds', icon: BedDouble, apiStatus: 'available', apiNote: '/buildings, /floors, /rooms, /beds, /room-amenities CRUD.' },
  residents: { key: 'residents', title: 'Residents & KYC', icon: Users, apiStatus: 'missing', apiNote: 'No resident, guardian or KYC endpoints yet.' },
  reservations: { key: 'reservations', title: 'Reservations', icon: Calendar, apiStatus: 'missing', apiNote: 'No reservation endpoints yet.' },
  finance: { key: 'finance', title: 'Rent & payments', icon: IndianRupee, apiStatus: 'missing', apiNote: 'No invoice or payment endpoints yet.' },
  deposits: { key: 'deposits', title: 'Security deposits', icon: Shield, apiStatus: 'missing', apiNote: 'No deposit endpoints yet.' },
  expenses: { key: 'expenses', title: 'Expenses', icon: Tag, apiStatus: 'missing', apiNote: 'No expense endpoints yet.' },
  complaints: { key: 'complaints', title: 'Complaints', icon: Wrench, apiStatus: 'missing', apiNote: 'No complaint endpoints yet.' },
  staff: { key: 'staff', title: 'Staff', icon: Users, apiStatus: 'partial', apiNote: 'Staff logins via /users + /user-roles. Missing: attendance, shifts, leave, salary.' },
  reports: { key: 'reports', title: 'Reports', icon: ChartColumn, apiStatus: 'missing', apiNote: 'No report endpoints yet.' },
  notifications: { key: 'notifications', title: 'Notifications & notices', icon: Bell, apiStatus: 'missing', apiNote: 'No notification or announcement endpoints yet.' },
  subscription: { key: 'subscription', title: 'Subscription', icon: Star, apiStatus: 'missing', apiNote: 'No subscription endpoints yet.' },
  settings: { key: 'settings', title: 'Settings', icon: Settings, apiStatus: 'partial', apiNote: 'Business profile via /tenants, owner profile via /users. Missing: change password, preferences.' },
} satisfies Record<string, ModuleInfo>;

export const residentModules = {
  home: { key: 'home', title: 'Home', icon: House, apiStatus: 'missing', apiNote: 'No resident "my stay" endpoint yet.' },
  rent: { key: 'rent', title: 'Rent & payments', icon: Receipt, apiStatus: 'missing', apiNote: 'No resident invoice/payment endpoints yet.' },
  complaints: { key: 'complaints', title: 'Complaints', icon: Wrench, apiStatus: 'missing', apiNote: 'No complaint endpoints yet.' },
  notices: { key: 'notices', title: 'Notices', icon: Megaphone, apiStatus: 'missing', apiNote: 'No notice endpoints yet.' },
  profile: { key: 'profile', title: 'Profile', icon: User, apiStatus: 'missing', apiNote: 'No resident profile/KYC endpoints yet.' },
  deposit: { key: 'deposit', title: 'Security deposit', icon: Lock, apiStatus: 'missing', apiNote: 'No deposit endpoints yet.' },
  documents: { key: 'documents', title: 'KYC documents', icon: FileText, apiStatus: 'missing', apiNote: 'No KYC or upload endpoints yet.' },
  help: { key: 'help', title: 'Help & support', icon: LifeBuoy, apiStatus: 'missing', apiNote: 'No support endpoints yet.' },
} satisfies Record<string, ModuleInfo>;

export const fallbackIcon = Inbox;
