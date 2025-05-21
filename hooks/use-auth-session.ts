import { authClient } from "@/lib/auth-client";
import { hasAccess, ValidRole } from "@/utils/has-access";

export function useAuthSession() {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  return {
    session,
    isPending,
    error,
    refetch,
    hasAccess: (requiredRole: ValidRole) =>
      hasAccess(session?.user.role as ValidRole, requiredRole),
  };
}
