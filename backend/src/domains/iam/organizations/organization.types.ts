
export interface CreateOrganizationInput {
  name: string;
  slug?: string;
  logo?: string;
  settings?: Record<string, unknown>;
  invites?: string[];
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  logo?: string | null;
  settings?: Record<string, unknown>;
}

export interface InviteMemberInput {
  email: string;
  roleId?: string;
  roleName?: string;
}
