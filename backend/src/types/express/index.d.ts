export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        organizationId?: string | null;
        membershipId?: string | null;
        role?: string | null;
      };
      auth?: {
        jti: string;
        exp?: number;
        token: string;
      };
      organization?: {
        id: string;
        name: string;
        slug: string;
        ownerId: string;
        logo?: string | null;
        settings?: unknown;
      };
      member?: {
        id: string;
        userId: string;
        organizationId: string;
        roleId: string;
        roleName: string;
      };
      permissions?: string[];
    }
  }
}
