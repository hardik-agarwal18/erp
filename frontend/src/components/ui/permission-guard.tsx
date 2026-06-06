"use client";

import React from "react";
import { usePermissions } from "@/hooks/use-permissions";

type PermissionGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
} & (
  | { permission: string; permissions?: never; mode?: never }
  | { permissions: string[]; mode: "all" | "any"; permission?: never }
);

export function PermissionGuard(props: PermissionGuardProps) {
  const { children, fallback = null } = props;
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let hasAccess = false;

  if (props.permission !== undefined) {
    hasAccess = hasPermission(props.permission);
  } else if (props.permissions !== undefined) {
    if (props.mode === "any") {
      hasAccess = hasAnyPermission(props.permissions);
    } else if (props.mode === "all") {
      hasAccess = hasAllPermissions(props.permissions);
    }
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
