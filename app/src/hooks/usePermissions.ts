import { useMemo } from "react";
import {
  can,
  getPermissions,
  isProfessional,
  type Permission,
  type RoleType,
} from "@/lib/permissions";

interface UsePermissionsReturn {
  can: (permission: Permission) => boolean;
  permissions: Permission[];
  isProfessional: boolean;
  role: RoleType;
}

export function usePermissions(role: string | undefined): UsePermissionsReturn {
  const safeRole = (role ?? "guest") as RoleType;
  return useMemo(() => ({
    can: (permission: Permission) => can(safeRole, permission),
    permissions: getPermissions(safeRole),
    isProfessional: isProfessional(safeRole),
    role: safeRole,
  }), [safeRole]);
}
