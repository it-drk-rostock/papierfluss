"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import { getSession } from "@/server/utils/get-session";

/**
 * Retrieves active workflows and forms based on the current user's role and team access.
 *
 * Access rules:
 * - Admin users: Can access all active workflows and forms
 * - Regular users: Can access:
 *   1. All active and public workflows/forms
 *   2. Active workflows/forms where the user belongs to an assigned team
 *
 * Note: Results are automatically deduplicated if an item matches multiple conditions.
 *
 * @returns {Promise<{
 *   workflows: Array<{ id: string; name: string; description?: string | null; isActive?: boolean; isPublic?: boolean }>;
 *   forms: Array<{ id: string; title: string }>;
 * }>}
 * @throws {Error} If the query fails or if the user is not authorized
 */
export const getWorkflowsAndForms = async () => {
  /* const { user } = await authQuery(); */
  const session = await getSession();

  if (!session) {
    return {
      forms: [],
      workflows: [],
    };
  }

  if (session.user.role === "admin") {
    const [workflows, forms] = await Promise.all([
      prisma.workflow.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.form.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          title: true,
        },
      }),
    ]);

    return {
      workflows: workflows,
      forms: forms,
    };
  }

  // For non-admin users
  const permissionConditions = {
    isActive: true,
    OR: [
      { isPublic: true },
      {
        teams: {
          some: {
            users: {
              some: { id: session.user.id },
            },
          },
        },
      },
    ],
  };

  const whereClause = permissionConditions;

  const [workflows, forms] = await Promise.all([
    prisma.workflow.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        isPublic: true,
      },
    }),
    prisma.form.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
      },
    }),
  ]);

  return {
    forms: forms,
    workflows: workflows,
  };
};

export type WorkflowsAndFormsProps = Awaited<
  ReturnType<typeof getWorkflowsAndForms>
>;
