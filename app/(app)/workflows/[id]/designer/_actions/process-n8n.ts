"use server";

import prisma from "@/lib/prisma";
import { authActionClient } from "@/server/utils/action-clients";
import { authQuery } from "@/server/utils/auth-query";
import { formatError } from "@/utils/format-error";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import {
  connectProcessN8nWorkflowSchema,
  disconnectProcessN8nWorkflowSchema,
} from "../_schemas/process-n8n";
import jsonLogic from "json-logic-js";

/**
 * Gets all N8n workflows for a process
 */
export const getProcessN8nWorkflows = async (id: string) => {
  const { user } = await authQuery();

  if (user.role === "admin") {
    return prisma.process.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        workflowId: true,
        workflow: {
          select: {
            responsibleTeam: {
              select: {
                name: true,
              },
            },
            teams: true,
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
        reactivateN8nWorkflows: {
          select: {
            id: true,
            name: true,
            workflowId: true,
          },
        },
      },
    });
  }

  const process = await prisma.process.findUnique({
    where: {
      id,
    },
    select: {
      name: true,
      id: true,
      workflowId: true,
      workflow: {
        select: {
          editWorkflowPermissions: true,
          responsibleTeam: {
            select: {
              name: true,
            },
          },
          teams: true,
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
      reactivateN8nWorkflows: {
        select: {
          id: true,
          name: true,
          workflowId: true,
        },
      },
    },
  });

  if (!process) return notFound();

  if (user.role !== "admin") {
    const context = {
      user: {
        ...user,
        teams: user.teams?.map((t) => t.name) ?? [],
      },
      workflow: {
        responsibleTeam: process.workflow.responsibleTeam?.name,
        teams: process.workflow.teams?.map((t) => t.name) ?? [],
      },
    };

    const rules = JSON.parse(process.workflow.editWorkflowPermissions || "{}");
    const hasPermission = await jsonLogic.apply(rules, context);

    if (!hasPermission) {
      throw new Error("Keine Berechtigung zum Bearbeiten dieses Prozesses");
    }
  }

  return process;
};

export type ProcessN8nWorkflowProps = Awaited<
  ReturnType<typeof getProcessN8nWorkflows>
>;

export type ProcessWorkflowType =
  | "saveN8nWorkflows"
  | "completeN8nWorkflows"
  | "reactivateN8nWorkflows";

/**
 * Connects an N8n workflow to a process
 */
export const connectProcessN8nWorkflow = authActionClient
  .schema(connectProcessN8nWorkflowSchema)
  .metadata({
    event: "connectProcessN8nWorkflowAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { processId, workflowType, workflows } = parsedInput;

    try {
      const process = await prisma.process.findUnique({
        where: { id: processId },
        select: {
          workflow: {
            select: {
              editWorkflowPermissions: true,
              responsibleTeam: true,
              teams: true,
            },
          },
        },
      });

      if (!process) {
        throw new Error("Process nicht gefunden");
      }

      // Permission check
      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            ...ctx.session.user,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          workflow: {
            responsibleTeam: process.workflow.responsibleTeam?.name,
            teams: process.workflow.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(
          process.workflow.editWorkflowPermissions || "{}"
        );
        const hasPermission = await jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Prozesses");
        }
      }

      await prisma.process.update({
        where: { id: processId },
        data: {
          [workflowType]: {
            connect: workflows.map((w) => ({ id: w.id })),
          },
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/workflows/${processId}/designer`);

    return {
      message: "N8n Workflows hinzugefügt",
    };
  });

/**
 * Disconnects an N8n workflow from a process
 */
export const disconnectProcessN8nWorkflow = authActionClient
  .schema(disconnectProcessN8nWorkflowSchema)
  .metadata({
    event: "disconnectProcessN8nWorkflowAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { processId, workflowType, n8nWorkflowId } = parsedInput;

    try {
      const process = await prisma.process.findUnique({
        where: { id: processId },
        select: {
          workflow: {
            select: {
              editWorkflowPermissions: true,
              responsibleTeam: true,
              teams: true,
            },
          },
        },
      });

      if (!process) {
        throw new Error("Process nicht gefunden");
      }

      // Permission check
      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            ...ctx.session.user,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          workflow: {
            responsibleTeam: process.workflow.responsibleTeam?.name,
            teams: process.workflow.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(
          process.workflow.editWorkflowPermissions || "{}"
        );
        const hasPermission = await jsonLogic.apply(rules, context);

        if (!hasPermission) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Prozesses");
        }
      }

      await prisma.process.update({
        where: { id: processId },
        data: {
          [workflowType]: {
            disconnect: { id: n8nWorkflowId },
          },
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/workflows/${processId}/designer`);

    return {
      message: "N8n Workflow entfernt",
    };
  });
