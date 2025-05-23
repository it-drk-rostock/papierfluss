import type { UserRole } from "@prisma/client";

export type ValidRole = UserRole;

export const hasAccess = (
  userRole: ValidRole,
  requiredRole: ValidRole
): boolean => {
  if (!userRole) return false;

  switch (requiredRole) {
    case "user":
      return true;
    case "moderator":
      return ["moderator", "admin"].includes(userRole);
    case "admin":
      return userRole === "admin";
    default:
      return false;
  }
};
