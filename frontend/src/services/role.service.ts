import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";

export type Permission = {
  id: string;
  name: string;
  description: string;
};

export type Role = {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: { permission: Permission }[];
};

export type CreateRoleRequest = {
  name: string;
  description?: string;
  permissionIds: string[];
};

export type UpdateRoleRequest = {
  name?: string;
  description?: string;
  permissionIds?: string[];
};

export const roleService = {
  listRoles: async () => {
    const res = await apiClient.get<{ data: Role[] }>(apiEndpoints.roles.list);
    return res.data;
  },

  listPermissions: async () => {
    const res = await apiClient.get<{ data: Permission[] }>(apiEndpoints.roles.permissions);
    return res.data;
  },

  getRoleDetails: async (roleId: string) => {
    const res = await apiClient.get<{ data: Role }>(apiEndpoints.roles.details(roleId));
    return res.data;
  },

  createRole: async (data: CreateRoleRequest) => {
    const res = await apiClient.post<{ data: Role }>(apiEndpoints.roles.create, data);
    return res.data;
  },

  updateRole: async (roleId: string, data: UpdateRoleRequest) => {
    const res = await apiClient.patch<{ data: Role }>(apiEndpoints.roles.update(roleId), data);
    return res.data;
  },

  deleteRole: async (roleId: string) => {
    const res = await apiClient.delete(apiEndpoints.roles.delete(roleId));
    return res.data;
  }
};
