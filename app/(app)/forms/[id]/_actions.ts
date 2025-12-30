"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import { notFound } from "next/navigation";
import jsonLogic from "json-logic-js";
import { formatError } from "@/utils/format-error";
import { revalidatePath } from "next/cache";
import { triggerN8nWebhooks } from "@/utils/trigger-n8n-webhooks";
import { authActionClient } from "@/server/utils/action-clients";
import { idSchema } from "@/schemas/id-schema";
import { z } from "zod/v4";
import { SubmissionStatus } from "@/generated/prisma/client";

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
export const getForm = async (
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
            isArchived: false,
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
          isArchived: false,
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

export type FormProps = NonNullable<Awaited<ReturnType<typeof getForm>>>;

export type FormSearchParams = {
  search: string;
  status: SubmissionStatus;
};

/**
 * Deletes a form
 */
export const deleteFormSubmission = authActionClient
  .schema(idSchema)
  .metadata({
    event: "deleteFormSubmissionAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;

    try {
      const formSubmission = await prisma.formSubmission.findUnique({
        where: { id },
        select: {
          form: {
            select: {
              id: true,
              title: true,
              description: true,
              reviewFormPermissions: true,
              teams: {
                select: {
                  name: true,
                },
              },
              archiveWorkflows: {
                select: {
                  workflowId: true,
                },
              },
              responsibleTeam: {
                select: {
                  name: true,
                  contactEmail: true,
                },
              },
            },
          },
          data: true,
        },
      });

      if (!formSubmission) {
        throw new Error("Formular nicht gefunden");
      }

      // Only check permissions if user is not admin
      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            email: ctx.session.user.email,
            name: ctx.session.user.name,
            role: ctx.session.user.role,
            id: ctx.session.user.id,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          form: {
            responsibleTeam: formSubmission.form.responsibleTeam?.name,
            teams: formSubmission.form.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(
          formSubmission.form.reviewFormPermissions || "{}"
        );
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error("Keine Berechtigung zum Löschen dieses Formulars");
        }
      }
      await prisma.formSubmission.delete({
        where: {
          id,
        },
      });

      revalidatePath(`/forms/${formSubmission.form.id}`);
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Formular gelöscht",
    };
  });

/**
 * Archives a form submission
 */
export const archiveFormSubmission = authActionClient
  .schema(
    idSchema.extend({
      message: z.string().optional(),
    })
  )
  .metadata({
    event: "archiveFormSubmissionAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id, message } = parsedInput;

    try {
      const formSubmission = await prisma.formSubmission.findUnique({
        where: { id, isArchived: false },
        select: {
          form: {
            select: {
              id: true,
              title: true,
              description: true,
              reviewFormPermissions: true,
              teams: {
                select: {
                  name: true,
                },
              },
              archiveWorkflows: {
                select: {
                  workflowId: true,
                },
              },
              responsibleTeam: {
                select: {
                  name: true,
                  contactEmail: true,
                },
              },
            },
          },
          data: true,
        },
      });

      if (!formSubmission) {
        throw new Error("Formular nicht gefunden");
      }

      // Only check permissions if user is not admin
      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            email: ctx.session.user.email,
            name: ctx.session.user.name,
            role: ctx.session.user.role,
            id: ctx.session.user.id,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          form: {
            responsibleTeam: formSubmission.form.responsibleTeam?.name,
            teams: formSubmission.form.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(
          formSubmission.form.reviewFormPermissions || "{}"
        );
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error(
            "Keine Berechtigung zum Archivieren dieses Formulars"
          );
        }
      }
      await prisma.formSubmission.update({
        where: {
          id,
        },
        data: {
          isArchived: true,
          archivedNotes: message,
          archivedAt: new Date(),
        },
      });

      const submissionContext = {
        user: {
          ...ctx.session.user,
          teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
        },
        form: {
          responsibleTeam: formSubmission.form.responsibleTeam?.name,
          teams: formSubmission.form.teams?.map((t) => t.name) ?? [],
        },
        data: formSubmission.data,
      };

      await triggerN8nWebhooks(
        formSubmission.form.archiveWorkflows.map((w) => w.workflowId),
        submissionContext
      );

      revalidatePath(`/forms/${formSubmission.form.id}`);
      revalidatePath(`/form-submissions/${id}`);
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Formular archiviert",
    };
  });
