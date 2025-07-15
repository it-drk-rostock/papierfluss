"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import { notFound } from "next/navigation";
import jsonLogic from "json-logic-js";

/**
 * Retrieves a form from the database based on user's role and access permissions.
 *
 * Access rules:
 * - Admin users: Can access all forms
 * - Regular users: Can access forms where the user belongs to an assigned team
 *
 * @param {string} id - The unique identifier of the form to retrieve
 * @returns {Promise<{
 *   id: string;
 *   submissions: Array<{
 *     id: string;
 *     status: string;
 *     submittedBy: {
 *       id: string;
 *       name: string;
 *     };
 *   }>;
 * } | null>} For admin users: Returns a single form or null if not found
 * @returns {Promise<Array<{
 *   id: string;
 *   submissions: Array<{
 *     id: string;
 *     status: string;
 *     submittedBy: {
 *       id: string;
 *       name: string;
 *     }>;
 *   }>;
 * }>>} For regular users: Returns an array of accessible forms
 * @throws {Error} If the query fails or if the user is not authorized
 */
export const getFormArchive = async (id: string) => {
  const { user } = await authQuery();

  if (user.role === "admin") {
    return prisma.form.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        teams: {
          select: {
            name: true,
          },
        },
        information: true,
        responsibleTeam: {
          select: {
            name: true,
          },
        },
        schema: true,
        submissions: {
          where: {
            isArchived: true,
          },
          select: {
            id: true,
            data: true,
            status: true,

            submittedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  const form = await prisma.form.findUnique({
    where: {
      id,
    },
    select: {
      title: true,
      id: true,
      description: true,
      reviewFormPermissions: true,
      teams: {
        select: {
          name: true,
        },
      },
      responsibleTeam: {
        select: {
          name: true,
        },
      },
      information: true,
      schema: true,
      submissions: {
        where: {
          isArchived: true,
        },
        select: {
          id: true,
          status: true,
          data: true,

          submittedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!form) return notFound();

  const filteredSubmissions = form.submissions
    ? await Promise.all(
        form.submissions.map(async (submission) => {
          const submissionContext = {
            user: {
              ...user,
              teams: user.teams?.map((t) => t.name) ?? [],
            },
            form: {
              responsibleTeam: form.responsibleTeam?.name,
              teams: form.teams?.map((t) => t.name) ?? [],
            },
            data: submission.data,
          };

          const rules = await JSON.parse(form.reviewFormPermissions || "{}");

          const result = await jsonLogic.apply(rules, submissionContext);

          return result === true ? submission : null;
        })
      ).then((results) => results.filter(Boolean))
    : [];

  return { ...form, submissions: filteredSubmissions };
};

export type FormArchiveProps = NonNullable<
  Awaited<ReturnType<typeof getFormArchive>>
>;
