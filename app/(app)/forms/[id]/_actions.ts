"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import jsonata from "jsonata";
import { notFound } from "next/navigation";

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
export const getForm = async (id: string) => {
  const { user } = await authQuery();

  if (user.role === "admin") {
    return prisma.form.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        teams: {
          select: {
            name: true,
          },
        },
        schema: true,
        submissions: {
          where: {
            status: {
              not: "archived",
            },
          },
          select: {
            id: true,
            data: true,
            status: true,
            isExample: true,
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
      reviewFormPermissions: true,
      teams: {
        select: {
          name: true,
        },
      },
      schema: true,
      submissions: {
        where: {
          status: {
            not: "archived",
          },
        },
        select: {
          id: true,
          status: true,
          data: true,
          isExample: true,
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
            teams: user.teams?.map((t) => t.name) ?? [],
            formTeams: form.teams?.map((t) => t.name) ?? [],
            data: submission.data,
          };

          const expressionString = form.reviewFormPermissions || "";

          const result = await jsonata(expressionString).evaluate(
            submissionContext
          );

          return result === true ? submission : null;
        })
      ).then((results) => results.filter(Boolean))
    : [];

  return { ...form, submissions: filteredSubmissions };
};

export type FormProps = Awaited<ReturnType<typeof getForm>>;
