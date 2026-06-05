"use client";

import { useSession } from "next-auth/react";

interface PermissionGuardProps {
  children: React.ReactNode;
  // For now, use role-based checks. Full per-screen permissions can be added later.
  requiredRoles?: ("OWNER" | "MANAGER" | "WORKER")[];
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  requiredRoles,
  fallback = null,
}: PermissionGuardProps) {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "OWNER";

  // Owners always have access
  if (role === "OWNER") return <>{children}</>;

  // If no role restriction, allow all
  if (!requiredRoles || requiredRoles.length === 0) return <>{children}</>;

  // Check if user's role is in allowed roles
  if (requiredRoles.includes(role)) return <>{children}</>;

  return <>{fallback}</>;
}
