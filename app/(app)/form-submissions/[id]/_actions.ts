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
import jsonata from "jsonata";
import { forbidden, redirect } from "next/navigation";

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
          },
        },
        reviewNotes: true,
        rejectedNotes: true,
        completedNotes: true,
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
      status: true,
      data: true,
    },
  });

  if (!form) return null;

  const submissionContext = {
    user: {
      ...user,
      teams: user.teams?.map((t) => t.name) ?? [],
    },
    teams: user.teams?.map((t) => t.name) ?? [],
    formTeams: form.form.teams?.map((t) => t.name) ?? [],
    data: form.data,
  };

  const expressionString = form.form.reviewFormPermissions || "";
  const hasPermission = await jsonata(expressionString).evaluate(
    submissionContext
  );

  if (!hasPermission) {
    forbidden();
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
              saveWorkflows: {
                select: {
                  workflowId: true,
                },
              },
            },
          },
        },
      });

      const webhookPromises = submission.form.saveWorkflows.map((workflow) =>
        fetch(
          `${process.env.NEXT_PUBLIC_N8N_URL}/webhook/${workflow.workflowId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "n8n-webhook-api-key": process.env.N8N_WEBHOOK_API_KEY!,
            },
            body: JSON.stringify(submission.data),
          }
        )
      );

      await Promise.all(webhookPromises);
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
              revokeWorkflows: {
                select: {
                  workflowId: true,
                },
              },
            },
          },
        },
      });

      const webhookPromises = submission.form.revokeWorkflows.map((workflow) =>
        fetch(
          `${process.env.NEXT_PUBLIC_N8N_URL}/webhook/${workflow.workflowId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "n8n-webhook-api-key": process.env.N8N_WEBHOOK_API_KEY!,
            },
            body: JSON.stringify(submission.data),
          }
        )
      );

      await Promise.all(webhookPromises);
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
              schema: true,
              reviewFormPermissions: true,
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
          teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          formTeams: form.form.teams?.map((t) => t.name) ?? [],
          data: form.data,
        };

        const expressionString = form.form.reviewFormPermissions || "";
        const hasPermission = await jsonata(expressionString).evaluate(
          submissionContext
        );

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
                reUpdateWorkflows: {
                  select: {
                    workflowId: true,
                  },
                },
              },
            },
          },
        });

        const webhookPromises = submission.form.reUpdateWorkflows.map(
          (workflow) =>
            fetch(
              `${process.env.NEXT_PUBLIC_N8N_URL}/webhook/${workflow.workflowId}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "n8n-webhook-api-key": process.env.N8N_WEBHOOK_API_KEY!,
                },
                body: JSON.stringify(submission.data),
              }
            )
        );

        await Promise.all(webhookPromises);
      }

      if (status === "rejected") {
        const submission = await prisma.formSubmission.update({
          where: {
            id,
            status: "inReview",
          },
          data: {
            status,
            rejectedNotes: message,
          },
          select: {
            data: true,
            form: {
              select: {
                rejectWorkflows: {
                  select: {
                    workflowId: true,
                  },
                },
              },
            },
          },
        });

        const webhookPromises = submission.form.rejectWorkflows.map(
          (workflow) =>
            fetch(
              `${process.env.NEXT_PUBLIC_N8N_URL}/webhook/${workflow.workflowId}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "n8n-webhook-api-key": process.env.N8N_WEBHOOK_API_KEY!,
                },
                body: JSON.stringify(submission.data),
              }
            )
        );

        await Promise.all(webhookPromises);
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
          },
          select: {
            data: true,
            form: {
              select: {
                completeWorkflows: {
                  select: {
                    workflowId: true,
                  },
                },
              },
            },
          },
        });

        const webhookPromises = submission.form.completeWorkflows.map(
          (workflow) =>
            fetch(
              `${process.env.NEXT_PUBLIC_N8N_URL}/webhook/${workflow.workflowId}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "n8n-webhook-api-key": process.env.N8N_WEBHOOK_API_KEY!,
                },
                body: JSON.stringify(submission.data),
              }
            )
        );

        await Promise.all(webhookPromises);
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
  .schema(updateFormSubmissionSchema)
  .metadata({
    event: "submitFormSubmissionAction",
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
          status: "submitted",
          data,
          reviewNotes: null,
        },
        select: {
          data: true,
          form: {
            select: {
              submitWorkflows: {
                select: {
                  workflowId: true,
                },
              },
            },
          },
        },
      });

      const webhookPromises = submission.form.submitWorkflows.map((workflow) =>
        fetch(
          `${process.env.NEXT_PUBLIC_N8N_URL}/webhook/${workflow.workflowId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "n8n-webhook-api-key": process.env.N8N_WEBHOOK_API_KEY!,
            },
            body: JSON.stringify(submission.data),
          }
        )
      );

      await Promise.all(webhookPromises);
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
              schema: true,
              reviewFormPermissions: true,
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
          teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          formTeams: form.form.teams?.map((t) => t.name) ?? [],
          data: form.data,
        };

        const expressionString = form.form.reviewFormPermissions || "";
        const hasPermission = await jsonata(expressionString).evaluate(
          submissionContext
        );

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
        },
        select: {
          data: true,
          form: {
            select: {
              reviewWorkflows: {
                select: {
                  workflowId: true,
                },
              },
            },
          },
        },
      });

      const webhookPromises = submission.form.reviewWorkflows.map((workflow) =>
        fetch(
          `${process.env.NEXT_PUBLIC_N8N_URL}/webhook/${workflow.workflowId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "n8n-webhook-api-key": process.env.N8N_WEBHOOK_API_KEY!,
            },
            body: JSON.stringify(submission.data),
          }
        )
      );

      await Promise.all(webhookPromises);
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/form-submissions/${id}`);

    return {
      message: "Formular wurde zur Prüfung aktualisiert",
    };
  });
