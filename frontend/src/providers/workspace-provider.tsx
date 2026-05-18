"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { configureApiClient, getStoredAccessToken, getStoredOrganizationId, setStoredAccessToken, setStoredOrganizationId } from "@/api/client";
import { featurePermissions } from "@/constants/permissions";
import * as authService from "@/services/auth.service";
import type { FeatureKey, UserSession, Workspace } from "@/types/app";

const DEFAULT_CURRENCY = "USD";

function buildInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "PL";
}

function mapWorkspace(organization: {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  membershipId: string | null;
  roleId: string | null;
  role: string;
}) {
  return {
    id: organization.id,
    name: organization.name,
    companyName: organization.name,
    role: organization.role,
    currency: DEFAULT_CURRENCY,
    slug: organization.slug,
    membershipId: organization.membershipId,
    roleId: organization.roleId,
    logo: organization.logo,
  } satisfies Workspace;
}

type WorkspaceContextValue = {
  workspace: Workspace;
  workspaces: Workspace[];
  session: UserSession;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  setWorkspaceById: (workspaceId: string) => Promise<void>;
  canAccess: (feature: FeatureKey) => boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  signIn: typeof authService.login;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const FALLBACK_WORKSPACE: Workspace = {
  id: "",
  name: "No workspace",
  companyName: "No workspace",
  role: "member",
  currency: DEFAULT_CURRENCY,
};

const FALLBACK_SESSION: UserSession = {
  id: "",
  name: "Guest User",
  email: "",
  isVerified: false,
  role: null,
  initials: "GU",
};

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(getStoredOrganizationId());
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const workspace = useMemo(
    () => workspaces.find((item) => item.id === workspaceId) ?? workspaces[0] ?? FALLBACK_WORKSPACE,
    [workspaceId, workspaces],
  );

  const clearSession = useCallback(() => {
    setStoredAccessToken(null);
    setStoredOrganizationId(null);
    setSession(null);
    setWorkspaces([]);
    setWorkspaceId(null);
    setPermissions([]);
  }, []);

  const hydrateSession = useCallback(
    async (accessToken?: string | null) => {
      if (accessToken) {
        setStoredAccessToken(accessToken);
      }

      const me = await authService.getCurrentUser();
      const nextWorkspaces = me.organizations.map(mapWorkspace);
      const activeWorkspace = me.activeOrganization ? mapWorkspace(me.activeOrganization) : nextWorkspaces[0] ?? null;
      const nextWorkspaceId = activeWorkspace?.id ?? null;

      setSession({
        id: me.id,
        name: me.name,
        email: me.email,
        isVerified: me.isVerified,
        role: activeWorkspace?.role ?? null,
        initials: buildInitials(me.name),
      });
      setWorkspaces(nextWorkspaces);
      setWorkspaceId(nextWorkspaceId);
      setStoredOrganizationId(nextWorkspaceId);

      if (nextWorkspaceId) {
        const nextPermissions = await authService.listPermissions();
        setPermissions(nextPermissions.map((permission) => permission.name));
      } else {
        setPermissions([]);
      }
    },
    [],
  );

  const restoreSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedAccessToken = getStoredAccessToken();

      if (!storedAccessToken) {
        const refreshedAccessToken = await authService.refreshToken();
        await hydrateSession(refreshedAccessToken);
        return;
      }

      await hydrateSession(storedAccessToken);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession, hydrateSession]);

  useEffect(() => {
    configureApiClient({
      getAccessToken: getStoredAccessToken,
      getOrganizationId: () => workspaceId,
      refreshAccessToken: authService.refreshToken,
      onUnauthorized: () => {
        clearSession();
        router.replace("/login");
      },
    });
  }, [clearSession, router, workspaceId]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspace,
      workspaces,
      session: session ?? FALLBACK_SESSION,
      isAuthenticated: Boolean(session?.id),
      isLoading,
      permissions,
      setWorkspaceById: async (nextWorkspaceId) => {
        const result = await authService.switchWorkspace(nextWorkspaceId);
        setStoredAccessToken(result.accessToken);
        setStoredOrganizationId(result.activeOrganization?.id ?? null);
        setWorkspaces(result.organizations.map(mapWorkspace));
        setWorkspaceId(result.activeOrganization?.id ?? null);
        setPermissions((await authService.listPermissions()).map((permission) => permission.name));
        setSession((current) => ({
          ...(current ?? FALLBACK_SESSION),
          role: result.activeOrganization?.role ?? null,
        }));
      },
      canAccess: (feature) => featurePermissions[feature].some((permission) => permissions.includes(permission)),
      hasPermission: (permission) => permissions.includes(permission),
      hasRole: (role) => workspace.role === role,
      signIn: async (payload) => {
        const result = await authService.login(payload);
        await hydrateSession(result.accessToken);
        return result;
      },
      signOut: async () => {
        try {
          await authService.logout();
        } finally {
          clearSession();
        }
      },
      restoreSession,
    }),
    [clearSession, hydrateSession, isLoading, permissions, restoreSession, session, workspace, workspaces],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspaceContext must be used within WorkspaceProvider");
  }

  return context;
}
