"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import { notFound } from "next/navigation";
import jsonLogic from "json-logic-js";
import { SubmissionStatus } from "@/generated/prisma/browser";

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
export const getFormArchive = async (
  id: string,
  { search, status }: { search: string; status: SubmissionStatus }
) => {
  const { user } = await authQuery();

  // Get the form data first to access information for search
  const form = await prisma.form.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      information: true,
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
      schema: true,
      reviewFormPermissions: true,
    },
  });

  if (!form) return notFound();

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
            ...(status && { status }),
            ...(search &&
              form.information && {
                data: {
                  path: (
                    form.information as { fields: { fieldKey: string }[] }
                  ).fields.map((field) => field.fieldKey),
                  string_contains: search as string,
                },
              }),
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

  // For non-admin users, get the form with submissions and apply permissions
  const formWithSubmissions = await prisma.form.findUnique({
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
          ...(status && { status }),
          ...(search &&
            form.information && {
              data: {
                path: (
                  form.information as { fields: { fieldKey: string }[] }
                ).fields.map((field) => field.fieldKey),
                string_contains: search as string,
              },
            }),
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

  if (!formWithSubmissions) return notFound();

  const filteredSubmissions = formWithSubmissions.submissions
    ? await Promise.all(
        formWithSubmissions.submissions.map(async (submission) => {
          const submissionContext = {
            user: {
              ...user,
              teams: user.teams?.map((t) => t.name) ?? [],
            },
            form: {
              responsibleTeam: formWithSubmissions.responsibleTeam?.name,
              teams: formWithSubmissions.teams?.map((t) => t.name) ?? [],
            },
            data: submission.data,
          };

          const rules = await JSON.parse(
            formWithSubmissions.reviewFormPermissions || "{}"
          );

          const result = await jsonLogic.apply(rules, submissionContext);

          return result === true ? submission : null;
        })
      ).then((results) => results.filter(Boolean))
    : [];

  return { ...formWithSubmissions, submissions: filteredSubmissions };
};

export type FormArchiveProps = NonNullable<
  Awaited<ReturnType<typeof getFormArchive>>
>;
