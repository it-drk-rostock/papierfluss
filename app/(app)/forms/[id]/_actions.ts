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
import { z } from "zod";

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
        responsibleTeam: {
          select: {
            name: true,
          },
        },
        schema: true,
        submissions: {
          where: {
            isArchived: false,
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
      schema: true,
      submissions: {
        where: {
          isArchived: false,
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

export type FormProps = NonNullable<Awaited<ReturnType<typeof getForm>>>;

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
 * Archives a workflow run
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
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Formular archiviert",
    };
  });
