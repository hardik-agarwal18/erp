export type MemberRole = "owner" | "admin" | "manager" | "member";

export type OrganizationMemberDTO = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  joinedAt: string;
};

export type OrganizationDTO = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  ownerId: string;
  settings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type InvitationDTO = {
  id: string;
  organizationId: string;
  email: string;
  roleId: string;
  token: string;
  expiresAt: string;
  invitedBy: string;
};

export type AuditLogDTO = {
  id: string;
  organizationId: string;
  actorUserId: string;
  actor: {
    name: string;
    email: string;
  };
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type OrganizationMember = OrganizationMemberDTO;
export type Organization = OrganizationDTO;
