"use server";

import prisma from "@/lib/prisma";
import { authActionClient } from "@/server/utils/action-clients";
import { authQuery } from "@/server/utils/auth-query";
import { formatError } from "@/utils/format-error";
import jsonata from "jsonata";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import {
  connectN8nWorkflowSchema,
  disconnectN8nWorkflowSchema,
} from "./_schemas";
import jsonLogic from "json-logic-js";

/**
 * Retrieves a form's N8n workflow configurations based on user's role and access permissions.
 *
 * Access rules:
 * - Admin users: Can access all forms
 * - Regular users: Can only access forms where they have permission based on editFormPermissions
 *
 * @param {string} id - The unique identifier of the form to retrieve
 * @returns {Promise<{
 *   id: string;
 *   title: string;
 *   fillOutWorkflows: Array<{ id: string; name: string; workflowId: string; }>;
 *   saveWorkflows: Array<{ id: string; name: string; workflowId: string; }>;
 *   revokeWorkflows: Array<{ id: string; name: string; workflowId: string; }>;
 *   submitWorkflows: Array<{ id: string; name: string; workflowId: string; }>;
 *   reviewWorkflows: Array<{ id: string; name: string; workflowId: string; }>;
 *   reUpdateWorkflows: Array<{ id: string; name: string; workflowId: string; }>;
 *   rejectWorkflows: Array<{ id: string; name: string; workflowId: string; }>;
 *   completeWorkflows: Array<{ id: string; name: string; workflowId: string; }>;
 *   archiveWorkflows: Array<{ id: string; name: string; workflowId: string; }>;
 * }>} Returns the form with its workflow configurations
 * @throws {Error} If the user doesn't have permission to edit the form
 * @throws {NotFoundError} If the form doesn't exist
 */
export const getFormN8nWorkflows = async (id: string) => {
  const { user } = await authQuery();

  if (user.role === "admin") {
    return prisma.form.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        responsibleTeam: {
          select: {
            name: true,
          },
        },
        teams: true,
        fillOutWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        saveWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        revokeWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        submitWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        reviewWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        reUpdateWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        rejectWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        completeWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        archiveWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
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
      editFormPermissions: true,
      responsibleTeam: {
        select: {
          name: true,
        },
      },
      teams: true,
      fillOutWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
      saveWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
      revokeWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
      submitWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
      reviewWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
      reUpdateWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
      rejectWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
      completeWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
      archiveWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
    },
  });

  if (!form) return notFound();

  if (user.role !== "admin") {
    const context = {
      user: {
        ...user,
        teams: user.teams?.map((t) => t.name) ?? [],
      },
      form: {
        responsibleTeam: form.responsibleTeam?.name,
        teams: form.teams?.map((t) => t.name) ?? [],
      },
    };

    const rules = JSON.parse(form.editFormPermissions || "{}");
    const hasPermission = await jsonLogic.apply(rules, context);

    if (!hasPermission) {
      throw new Error("Keine Berechtigung zum Bearbeiten dieses Formulars");
    }
  }

  return form;
};

export type FormN8nWorkflowProps = Awaited<
  ReturnType<typeof getFormN8nWorkflows>
>;

export type WorkflowType =
  | "fillOutWorkflows"
  | "saveWorkflows"
  | "revokeWorkflows"
  | "submitWorkflows"
  | "reviewWorkflows"
  | "reUpdateWorkflows"
  | "rejectWorkflows"
  | "completeWorkflows"
  | "archiveWorkflows";

/**
 * Connects an N8n workflow to/from a form
 */
export const connectN8nWorkflow = authActionClient
  .schema(connectN8nWorkflowSchema)
  .metadata({
    event: "connectN8nWorkflowAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { formId, workflowType, workflows } = parsedInput;

    try {
      const form = await prisma.form.findUnique({
        where: { id: formId },
        select: {
          editFormPermissions: true,
          responsibleTeam: true,
          teams: true,
        },
      });

      if (!form) {
        throw new Error("Formular nicht gefunden");
      }

      // Permission check
      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            ...ctx.session.user,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          form: {
            responsibleTeam: form.responsibleTeam?.name,
            teams: form.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(form.editFormPermissions || "{}");
        const hasPermission = await jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Formulars");
        }
      }

      await prisma.form.update({
        where: { id: formId },
        data: {
          [workflowType]: {
            connect: workflows.map((w) => ({ id: w.id })),
          },
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/forms/${formId}/n8n`);

    return {
      message: "N8n Workflows hinzugefügt",
    };
  });

/**
 * Connects an N8n workflow to/from a form
 */
export const disconnectN8nWorkflow = authActionClient
  .schema(disconnectN8nWorkflowSchema)
  .metadata({
    event: "disconnectN8nWorkflowAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { formId, workflowType, workflowId } = parsedInput;

    try {
      const form = await prisma.form.findUnique({
        where: { id: formId },
        select: {
          editFormPermissions: true,
          responsibleTeam: true,
          teams: true,
        },
      });

      if (!form) {
        throw new Error("Formular nicht gefunden");
      }

      // Permission check
      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            ...ctx.session.user,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          form: {
            responsibleTeam: form.responsibleTeam?.name,
            teams: form.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(form.editFormPermissions || "{}");
        const hasPermission = await jsonLogic.apply(rules, context);

        if (!hasPermission) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Formulars");
        }
      }

      await prisma.form.update({
        where: { id: formId },
        data: {
          [workflowType]: {
            disconnect: { id: workflowId },
          },
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/forms/${formId}/n8n`);

    return {
      message: "N8n Workflow entfernt",
    };
  });
