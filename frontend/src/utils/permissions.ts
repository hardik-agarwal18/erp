/**
 * Frontend Permission Engine Utilities
 * Shared implementation that must mirror the backend evaluation behavior.
 */

export const hasPermission = (userPermissions: string[], permission: string): boolean => {
  return userPermissions.includes(permission);
};

export const hasAnyPermission = (userPermissions: string[], permissions: string[]): boolean => {
  return permissions.some((permission) => userPermissions.includes(permission));
};

export const hasAllPermissions = (userPermissions: string[], permissions: string[]): boolean => {
  return permissions.every((permission) => userPermissions.includes(permission));
};
