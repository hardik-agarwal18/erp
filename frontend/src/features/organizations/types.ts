export type MemberRole = "owner" | "admin" | "manager" | "member";

export type OrganizationMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  joinedAt: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
};
