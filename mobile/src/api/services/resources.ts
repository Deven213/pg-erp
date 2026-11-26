import { endpoints } from '../endpoints';
import type {
  BedRecord,
  BedUpsert,
  BuildingRecord,
  BuildingUpsert,
  FloorRecord,
  FloorUpsert,
  PermissionRecord,
  PermissionUpsert,
  PropertyRecord,
  PropertyUpsert,
  RolePermissionRecord,
  RolePermissionUpsert,
  RoleRecord,
  RoleUpsert,
  RoomAmenityRecord,
  RoomAmenityUpsert,
  RoomRecord,
  RoomUpsert,
  TenantRecord,
  TenantUpsert,
  UserRecord,
  UserRoleRecord,
  UserRoleUpsert,
  UserUpsert,
} from '../types/models';
import { createCrudService } from './crud';

// Property hierarchy — used by the Owner app (Phase 5.2–5.3).
export const propertiesService = createCrudService<PropertyUpsert, PropertyRecord>(endpoints.properties);
export const buildingsService = createCrudService<BuildingUpsert, BuildingRecord>(endpoints.buildings);
export const floorsService = createCrudService<FloorUpsert, FloorRecord>(endpoints.floors);
export const roomsService = createCrudService<RoomUpsert, RoomRecord>(endpoints.rooms);
export const bedsService = createCrudService<BedUpsert, BedRecord>(endpoints.beds);
export const roomAmenitiesService = createCrudService<RoomAmenityUpsert, RoomAmenityRecord>(endpoints.roomAmenities);

// Business / users — business profile, owner profile and staff logins.
export const tenantsService = createCrudService<TenantUpsert, TenantRecord>(endpoints.tenants);
export const usersService = createCrudService<UserUpsert, UserRecord>(endpoints.users);
export const userRolesService = createCrudService<UserRoleUpsert, UserRoleRecord>(endpoints.userRoles);

// Platform administration — Super Admin only. Not used by the Owner/Resident app; kept typed for the separate admin build.
export const rolesService = createCrudService<RoleUpsert, RoleRecord>(endpoints.roles);
export const permissionsService = createCrudService<PermissionUpsert, PermissionRecord>(endpoints.permissions);
export const rolePermissionsService = createCrudService<RolePermissionUpsert, RolePermissionRecord>(endpoints.rolePermissions);
