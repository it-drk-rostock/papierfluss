"use server";

import prisma from "@/lib/prisma";
import { authActionClient } from "@/server/utils/action-clients";
import { authQuery } from "@/server/utils/auth-query";
import { formatError } from "@/utils/format-error";
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
export const getWorkflowN8nWorkflows = async (id: string) => {
  const { user } = await authQuery();

  if (user.role === "admin") {
    return prisma.workflow.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        responsibleTeam: {
          select: {
            name: true,
          },
        },
        teams: true,

        initializeN8nWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        saveN8nWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        completeN8nWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        archiveN8nWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        reactivateN8nWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
        lastN8nWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
      },
    });
  }

  if (user.role !== "moderator") {
    throw new Error("Keine Berechtigung zum Bearbeiten von Workflows");
  }

  const workflow = await prisma.workflow.findUnique({
    where: {
      id,
    },
    select: {
      name: true,
      id: true,
      editWorkflowPermissions: true,
      responsibleTeam: {
        select: {
          name: true,
        },
      },
      teams: true,
      initializeN8nWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
      saveN8nWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
      completeN8nWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
      archiveN8nWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
      reactivateN8nWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
      lastN8nWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
    },
  });

  if (!workflow) return notFound();

  const context = {
    user: {
      ...user,
      teams: user.teams?.map((t) => t.name) ?? [],
    },
    workflow: {
      responsibleTeam: workflow.responsibleTeam?.name,
      teams: workflow.teams?.map((t) => t.name) ?? [],
    },
  };

  const rules = JSON.parse(workflow.editWorkflowPermissions || "{}");
  const hasPermission = await jsonLogic.apply(rules, context);

  if (!hasPermission) {
    throw new Error("Keine Berechtigung zum Bearbeiten dieses Workflows");
  }

  return workflow;
};

export type WorkflowN8nWorkflowProps = Awaited<
  ReturnType<typeof getWorkflowN8nWorkflows>
>;

export type WorkflowType =
  | "initializeN8nWorkflows"
  | "saveN8nWorkflows"
  | "completeN8nWorkflows"
  | "archiveN8nWorkflows"
  | "reactivateN8nWorkflows"
  | "lastN8nWorkflows";

/**
 * Connects an N8n workflow to/from a form
 */
export const connectN8nWorkflow = authActionClient
  .schema(connectN8nWorkflowSchema)
  .metadata({
    event: "connectN8nWorkflowAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { workflowId, workflowType, workflows } = parsedInput;

    try {
      if (
        ctx.session.user.role !== "admin" &&
        ctx.session.user.role !== "moderator"
      ) {
        throw new Error("Keine Berechtigung zum Bearbeiten von Workflows");
      }
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: {
          editWorkflowPermissions: true,
          responsibleTeam: true,
          teams: true,
        },
      });

      if (!workflow) {
        throw new Error("Workflow nicht gefunden");
      }

      // Permission check
      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            ...ctx.session.user,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          workflow: {
            responsibleTeam: workflow.responsibleTeam?.name,
            teams: workflow.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(workflow.editWorkflowPermissions || "{}");
        const hasPermission = await jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Workflows");
        }
      }

      await prisma.workflow.update({
        where: { id: workflowId },
        data: {
          [workflowType]: {
            connect: workflows.map((w) => ({ id: w.id })),
          },
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/workflows/${workflowId}/n8n`);

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
    const { workflowId, workflowType, n8nWorkflowId } = parsedInput;

    try {
      if (
        ctx.session.user.role !== "admin" &&
        ctx.session.user.role !== "moderator"
      ) {
        throw new Error("Keine Berechtigung zum Bearbeiten von Workflows");
      }
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: {
          editWorkflowPermissions: true,
          responsibleTeam: true,
          teams: true,
        },
      });

      if (!workflow) {
        throw new Error("Workflow nicht gefunden");
      }

      // Permission check
      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            ...ctx.session.user,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          workflow: {
            responsibleTeam: workflow.responsibleTeam?.name,
            teams: workflow.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(workflow.editWorkflowPermissions || "{}");
        const hasPermission = await jsonLogic.apply(rules, context);

        if (!hasPermission) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Workflows");
        }
      }

      await prisma.workflow.update({
        where: { id: workflowId },
        data: {
          [workflowType]: {
            disconnect: { id: n8nWorkflowId },
          },
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/workflows/${workflowId}/n8n`);

    return {
      message: "N8n Workflow entfernt",
    };
  });
