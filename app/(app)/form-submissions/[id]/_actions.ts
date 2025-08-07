"use server";

import prisma from "@/lib/prisma";
import { authActionClient } from "@/server/utils/action-clients";
import { authQuery } from "@/server/utils/auth-query";
import {
  updateFormSubmissionSchema,
  updateFormSubmissionStatusSchema,
} from "./_schemas";
import { formatError } from "@/utils/format-error";
import { revalidatePath } from "next/cache";
import { idSchema } from "@/schemas/id-schema";
import { forbidden, notFound, redirect } from "next/navigation";
import jsonLogic from "json-logic-js";
import z from "zod";
import { triggerN8nWebhooks } from "@/utils/trigger-n8n-webhooks";

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
            reviewFormPermissions: true,
            responsibleTeam: {
              select: {
                name: true,
              },
            },
          },
        },
        reviewNotes: true,
        rejectedNotes: true,
        completedNotes: true,
        archivedNotes: true,
        submittedNotes: true,
        isArchived: true,
        status: true,
        data: true,
      },
    });
  }

  const form = await prisma.formSubmission.findFirst({
    where: { id },
    select: {
      id: true,
      form: {
        select: {
          id: true,
          title: true,
          schema: true,
          reviewFormPermissions: true,
          responsibleTeam: {
            select: {
              name: true,
            },
          },
          teams: {
            select: {
              name: true,
            },
          },
        },
      },
      reviewNotes: true,
      rejectedNotes: true,
      completedNotes: true,
      archivedNotes: true,
      submittedNotes: true,
      isArchived: true,
      status: true,
      data: true,
      submittedById: true,
    },
  });

  if (!form) return notFound();

  if (form.submittedById !== user.id) {
    const submissionContext = {
      user: {
        ...user,
        teams: user.teams?.map((t) => t.name) ?? [],
      },
      form: {
        responsibleTeam: form.form.responsibleTeam?.name,
        teams: form.form.teams?.map((t) => t.name) ?? [],
      },
      data: form.data,
    };

    const rules = await JSON.parse(form.form.reviewFormPermissions || "{}");

    const hasPermission = await jsonLogic.apply(rules, submissionContext);

    if (!hasPermission) {
      forbidden();
    }
  }

  return form;
};

export type FormSubmissionProps = Awaited<ReturnType<typeof getFormSubmission>>;

export const updateFormSubmission = authActionClient
  .schema(updateFormSubmissionSchema)
  .metadata({
    event: "updateFormSubmissionAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id, data } = parsedInput;

    try {
      const submission = await prisma.formSubmission.update({
        where: {
          id,
          ...(ctx.session.user.role !== "admin" && {
            submittedById: ctx.session.user.id,
          }),
          status: "ongoing",
        },
        data: {
          data,
        },
        select: {
          data: true,
          form: {
            select: {
              id: true,
              title: true,
              description: true,
              schema: true,
              teams: {
                select: {
                  name: true,
                },
              },
              reviewFormPermissions: true,
              responsibleTeam: {
                select: {
                  name: true,
                  id: true,
                  contactEmail: true,
                },
              },
              saveWorkflows: {
                select: {
                  workflowId: true,
                },
              },
            },
          },
        },
      });

      const submissionContext = {
        user: {
          ...ctx.session.user,
        },
        form: {
          responsibleTeam: submission.form.responsibleTeam?.name,
          teams: submission.form.teams?.map((t) => t.name) ?? [],
          title: submission.form.title,
          description: submission.form.description,
        },
        data: submission.data,
      };

      await triggerN8nWebhooks(
        submission.form.saveWorkflows.map((w) => w.workflowId),
        submissionContext
      );
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/form-submissions/${id}`);

    return {
      message: "Formular wurde gespeichert",
    };
  });

export const withdrawFormSubmission = authActionClient
  .schema(idSchema)
  .metadata({
    event: "withdrawFormSubmissionAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;

    try {
      const submission = await prisma.formSubmission.delete({
        where: {
          id,
          ...(ctx.session.user.role !== "admin" && {
            submittedById: ctx.session.user.id,
          }),
          status: "ongoing",
        },
        select: {
          data: true,
          form: {
            select: {
              teams: {
                select: {
                  name: true,
                },
              },
              responsibleTeam: {
                select: {
                  name: true,
                  id: true,
                  contactEmail: true,
                },
              },
              revokeWorkflows: {
                select: {
                  workflowId: true,
                },
              },
            },
          },
        },
      });

      const submissionContext = {
        user: {
          ...ctx.session.user,
        },
        form: {
          responsibleTeam: submission.form.responsibleTeam?.name,
          teams: submission.form.teams?.map((t) => t.name) ?? [],
        },
        data: submission.data,
      };

      await triggerN8nWebhooks(
        submission.form.revokeWorkflows.map((w) => w.workflowId),
        submissionContext
      );
    } catch (error) {
      throw formatError(error);
    }

    redirect("/dashboard");
  });

export const updateFormSubmissionStatus = authActionClient
  .schema(updateFormSubmissionStatusSchema)
  .metadata({
    event: "updateFormSubmissionStatusAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id, status, message } = parsedInput;

    try {
      const form = await prisma.formSubmission.findFirst({
        where: { id },
        select: {
          data: true,
          form: {
            select: {
              id: true,
              title: true,
              description: true,
              schema: true,
              reviewFormPermissions: true,
              responsibleTeam: {
                select: {
                  name: true,
                  id: true,
                  contactEmail: true,
                },
              },
              teams: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!form) throw new Error("Formular nicht gefunden");

      if (ctx.session.user.role !== "admin") {
        const submissionContext = {
          user: {
            ...ctx.session.user,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          form: {
            responsibleTeam: form.form.responsibleTeam?.name,
            teams: form.form.teams?.map((t) => t.name) ?? [],
          },
          data: form.data,
        };

        const rules = JSON.parse(form.form.reviewFormPermissions || "{}");
        const hasPermission = await jsonLogic.apply(rules, submissionContext);

        if (!hasPermission) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Formulars");
        }
      }

      if (status === "ongoing") {
        const submission = await prisma.formSubmission.update({
          where: {
            id,
            status: "inReview",
          },
          data: {
            status,
            reviewNotes: message,
          },
          select: {
            data: true,
            form: {
              select: {
                responsibleTeam: {
                  select: {
                    name: true,
                    id: true,
                    contactEmail: true,
                  },
                },
                reUpdateWorkflows: {
                  select: {
                    workflowId: true,
                  },
                },
              },
            },
          },
        });

        const submissionContext = {
          user: {
            ...ctx.session.user,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          form: {
            responsibleTeam: form.form.responsibleTeam,
            teams: form.form.teams?.map((t) => t.name) ?? [],
            title: form.form.title,
            description: form.form.description,
          },
          message,
          data: submission.data,
        };

        await triggerN8nWebhooks(
          submission.form.reUpdateWorkflows.map((w) => w.workflowId),
          submissionContext
        );
      }

      if (status === "rejected") {
        const submission = await prisma.formSubmission.update({
          where: {
            id,
            status: "inReview",
          },
          data: {
            completedAt: new Date(),
            status,
            rejectedNotes: message,
          },
          select: {
            data: true,
            form: {
              select: {
                responsibleTeam: {
                  select: {
                    name: true,
                    id: true,
                    contactEmail: true,
                  },
                },
                rejectWorkflows: {
                  select: {
                    workflowId: true,
                  },
                },
              },
            },
          },
        });

        const submissionContext = {
          user: {
            ...ctx.session.user,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          form: {
            responsibleTeam: form.form.responsibleTeam,
            teams: form.form.teams?.map((t) => t.name) ?? [],
            title: form.form.title,
            description: form.form.description,
          },
          message,
          data: submission.data,
        };

        await triggerN8nWebhooks(
          submission.form.rejectWorkflows.map((w) => w.workflowId),
          submissionContext
        );
      }

      if (status === "completed") {
        const submission = await prisma.formSubmission.update({
          where: {
            id,
            status: "inReview",
          },
          data: {
            status,
            completedNotes: message,
            completedAt: new Date(),
          },
          select: {
            data: true,
            form: {
              select: {
                responsibleTeam: {
                  select: {
                    name: true,
                    id: true,
                    contactEmail: true,
                  },
                },
                completeWorkflows: {
                  select: {
                    workflowId: true,
                  },
                },
              },
            },
          },
        });

        const submissionContext = {
          user: {
            ...ctx.session.user,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          form: {
            responsibleTeam: form.form.responsibleTeam,
            teams: form.form.teams?.map((t) => t.name) ?? [],
            title: form.form.title,
            description: form.form.description,
          },
          message,
          data: submission.data,
        };

        await triggerN8nWebhooks(
          submission.form.completeWorkflows.map((w) => w.workflowId),
          submissionContext
        );
      }
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/form-submissions/${id}`);

    return {
      message: "Formular wurde aktualisiert",
    };
  });

export const submitFormSubmission = authActionClient
  .schema(updateFormSubmissionSchema.extend({ message: z.string().optional() }))
  .metadata({
    event: "submitFormSubmissionAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id, data, message } = parsedInput;

    try {
      const submission = await prisma.formSubmission.update({
        where: {
          id,
          ...(ctx.session.user.role !== "admin" && {
            submittedById: ctx.session.user.id,
          }),
          status: "ongoing",
        },
        data: {
          status: "submitted",
          data,
          submittedNotes: message,
          reviewNotes: null,
        },
        select: {
          data: true,
          form: {
            select: {
              title: true,
              description: true,
              responsibleTeam: {
                select: {
                  name: true,
                  id: true,
                  contactEmail: true,
                },
              },
              teams: {
                select: {
                  name: true,
                },
              },
              submitWorkflows: {
                select: {
                  workflowId: true,
                },
              },
            },
          },
        },
      });

      const submissionContext = {
        user: {
          ...ctx.session.user,
          teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
        },
        form: {
          responsibleTeam: submission.form.responsibleTeam,
          teams: submission.form.teams?.map((t) => t.name) ?? [],
          title: submission.form.title,
          description: submission.form.description,
        },
        data: submission.data,
        message,
      };

      await triggerN8nWebhooks(
        submission.form.submitWorkflows.map((w) => w.workflowId),
        submissionContext
      );
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/form-submissions/${id}`);

    return {
      message: "Formular wurde gespeichert und eingereicht",
    };
  });

export const reviewFormSubmission = authActionClient
  .schema(idSchema)
  .metadata({
    event: "reviewFormSubmissionAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;

    try {
      const form = await prisma.formSubmission.findFirst({
        where: { id },
        select: {
          data: true,
          form: {
            select: {
              id: true,
              title: true,
              description: true,
              schema: true,
              reviewFormPermissions: true,
              responsibleTeam: {
                select: {
                  name: true,
                  id: true,
                  contactEmail: true,
                },
              },
              teams: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!form) throw new Error("Formular nicht gefunden");

      if (ctx.session.user.role !== "admin") {
        const submissionContext = {
          user: {
            ...ctx.session.user,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          form: {
            responsibleTeam: form.form.responsibleTeam?.name,
            teams: form.form.teams?.map((t) => t.name) ?? [],
            title: form.form.title,
            description: form.form.description,
          },
          data: form.data,
        };

        const rules = JSON.parse(form.form.reviewFormPermissions || "{}");
        const hasPermission = await jsonLogic.apply(rules, submissionContext);

        if (!hasPermission) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Formulars");
        }
      }
      const submission = await prisma.formSubmission.update({
        where: {
          id,
          status: "submitted",
        },
        data: {
          status: "inReview",
          submittedNotes: null,
        },
        select: {
          data: true,
          form: {
            select: {
              responsibleTeam: {
                select: {
                  name: true,
                  id: true,
                  contactEmail: true,
                },
              },
              reviewWorkflows: {
                select: {
                  workflowId: true,
                },
              },
            },
          },
        },
      });

      const submissionContext = {
        user: {
          ...ctx.session.user,
          teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
        },
        form: {
          responsibleTeam: form.form.responsibleTeam,
          teams: form.form.teams?.map((t) => t.name) ?? [],
        },
        data: submission.data,
      };

      await triggerN8nWebhooks(
        submission.form.reviewWorkflows.map((w) => w.workflowId),
        submissionContext
      );
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/form-submissions/${id}`);

    return {
      message: "Formular wurde zur Prüfung aktualisiert",
    };
  });
