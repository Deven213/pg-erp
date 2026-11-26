/**
 * Every path the app may call. Source: OpenAPI v0.1.0 (docs/openapi-v0.1.0.json in the repo root).
 * Do not add paths here that aren't in the spec.
 */
export const endpoints = {
  health: '/health',
  auth: {
    login: '/api/v1/auth/login',
    refresh: '/api/v1/auth/refresh',
    logout: '/api/v1/auth/logout',
  },
  tenants: '/api/v1/tenants',
  users: '/api/v1/users',
  roles: '/api/v1/roles',
  permissions: '/api/v1/permissions',
  userRoles: '/api/v1/user-roles',
  rolePermissions: '/api/v1/role-permissions',
  properties: '/api/v1/properties',
  buildings: '/api/v1/buildings',
  floors: '/api/v1/floors',
  rooms: '/api/v1/rooms',
  beds: '/api/v1/beds',
  roomAmenities: '/api/v1/room-amenities',
} as const;

/** Auth endpoints never get a Bearer token attached and never trigger a refresh-and-retry. */
export const unauthenticatedPaths: readonly string[] = [endpoints.auth.login, endpoints.auth.refresh, endpoints.auth.logout, endpoints.health];
