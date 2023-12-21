export interface AccessTokenPayload {
  sub: string;
  jti: string;
  type: "access";
  organizationId?: string;
  membershipId?: string;
  role?: string;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: "refresh";
  exp?: number;
}

export interface EmailTokenPayload {
  sub: string;
  jti: string;
  type: "email_verify";
}

export interface PasswordTokenPayload {
  sub: string;
  jti: string;
  type: "password_reset";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

export interface AuthContext {
  userId: string;
  organizationId?: string | null;
  membershipId?: string | null;
  role?: string | null;
}
