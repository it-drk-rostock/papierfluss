"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";

/**
 * Retrieves forms from the database based on user's role and access permissions.
 *
 * Access rules:
 * - Admin users: Can access all forms
 * - Regular users: Can access:
 *   1. All public forms
 *   2. Forms where the user belongs to an assigned team
 *
 * Note: Results are automatically deduplicated if a form matches multiple conditions
 *
 * @returns {Promise<Array<{
 *   id: string;
 *   schema: any;
 * }>>} Array of form objects matching the access criteria
 * @throws {Error} If the query fails or if the user is not authorized
 */
export const getFormSubmission = async (id: string) => {
  const { user } = await authQuery();

  if (user.role === "admin") {
    return prisma.formSubmission.findUnique({
      where: { id },
      select: {
        id: true,
        form: {
          select: {
            id: true,
            title: true,
            schema: true,
          },
        },
        status: true,
        data: true,
      },
    });
  }

  const form = await prisma.formSubmission.findFirst({
    where: {
      OR: [
        {
          form: {
            isPublic: true,
          },
        },
        {
          form: {
            teams: {
              some: {
                users: {
                  some: { id: user.id },
                },
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      form: {
        select: {
          id: true,
          title: true,
          schema: true,
        },
      },
      status: true,
      data: true,
    },
  });

  return form;
};

export type FormSubmissionProps = Awaited<ReturnType<typeof getFormSubmission>>;
