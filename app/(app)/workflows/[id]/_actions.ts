"use server";

import prisma from "@/lib/prisma";
import { idSchema } from "@/schemas/id-schema";
import { authActionClient } from "@/server/utils/action-clients";
import { authQuery } from "@/server/utils/auth-query";
import { formatError } from "@/utils/format-error";
import { triggerN8nWebhooks } from "@/utils/trigger-n8n-webhooks";
import { revalidatePath } from "next/cache";

import { redirect } from "next/navigation";

export const getWorkflowRuns = async (workflowId: string) => {
  await authQuery();

  // Get the workflow data first
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: {
      id: true,
      name: true,
      description: true,
      information: true,
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // Get the workflow runs
  const workflowRuns = await prisma.workflowRun.findMany({
    where: { workflowId: workflowId },
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
      processes: {
        select: {
          id: true,
          status: true,
          process: {
            select: {
              schema: true,
              name: true,
            },
          },
          data: true,
        },
      },
    },
  });

  return {
    workflow,
    runs: workflowRuns,
  };
};

/**
 * Type representing the return value of the getWorkflowRuns function
 * @type {WorkflowRun[]}
 */
export type WorkflowRunsProps = Awaited<ReturnType<typeof getWorkflowRuns>>;

/**
 * Initializes a new workflow run with process runs
 */
export const initializeWorkflowRun = authActionClient
  .schema(idSchema)
  .metadata({
    event: "initializeWorkflowRunAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id: workflowId } = parsedInput;

    let workflowRunId: string;

    try {
      // Get the workflow with its processes
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: {
          id: true,
          name: true,
          description: true,
          processes: {
            select: {
              id: true,
              isCategory: true,
            },
          },
          initializeN8nWorkflows: {
            select: {
              workflowId: true,
            },
          },
          responsibleTeam: {
            select: {
              contactEmail: true,
              name: true,
            },
          },
        },
      });

      if (!workflow) {
        throw new Error("Workflow nicht gefunden");
      }

      // Create the workflow run
      const workflowRun = await prisma.workflowRun.create({
        data: {
          workflow: {
            connect: { id: workflowId },
          },
          // Create process runs for all processes, including categories
          processes: {
            create: workflow.processes.map((process) => ({
              process: {
                connect: { id: process.id },
              },
            })),
          },
        },
      });

      workflowRunId = workflowRun.id;

      const submissionContext = {
        user: {
          ...ctx.session.user,
          teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
        },
        data: {
          workflow: {
            name: workflow.name,
            description: workflow.description,
          },
          responsibleTeam: {
            name: workflow.responsibleTeam?.name,
            contactEmail: workflow.responsibleTeam?.contactEmail,
          },
        },
      };

      await triggerN8nWebhooks(
        workflow.initializeN8nWorkflows.map((w) => w.workflowId),
        submissionContext
      );
    } catch (error) {
      throw formatError(error);
    }

    redirect(`/runs/${workflowRunId}`);
  });

/**
 * Deletes a workflow run
 */
export const deleteWorkflowRun = authActionClient
  .schema(idSchema)
  .metadata({
    event: "deleteWorkflowRunAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;

    try {
      const workflow = await prisma.workflowRun.delete({
        where: {
          id,
          ...(ctx.session.user.role !== "admin" && {
            workflow: {
              responsibleTeam: {
                id: {
                  in: ctx.session.user.teams?.map((team) => team.id) ?? [],
                },
              },
            },
          }),
        },
        select: {
          workflow: {
            select: {
              id: true,
            },
          },
        },
      });

      revalidatePath(`/workflows/${workflow.workflow.id}`);
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Workflow Ausführung gelöscht",
    };
  });

/**
 * Archives a workflow run
 */
export const archiveWorkflowRun = authActionClient
  .schema(idSchema)
  .metadata({
    event: "archiveWorkflowRunAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;

    try {
      const workflowRun = await prisma.workflowRun.update({
        where: {
          id,
          ...(ctx.session.user.role !== "admin" && {
            workflow: {
              responsibleTeam: {
                id: {
                  in: ctx.session.user.teams?.map((team) => team.id) ?? [],
                },
              },
            },
          }),
        },
        data: {
          status: "archived",
        },
        select: {
          workflow: {
            select: {
              id: true,
              name: true,
              description: true,
              archiveN8nWorkflows: {
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
          processes: {
            select: {
              id: true,
              data: true,
              status: true,
              process: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      if (!workflowRun) {
        throw new Error("Workflow Ausführung nicht gefunden");
      }

      const submissionContext = {
        user: {
          ...ctx.session.user,
          teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
        },
        data: {
          workflow: {
            name: workflowRun.workflow.name,
            description: workflowRun.workflow.description,
          },
          responsibleTeam: {
            name: workflowRun.workflow.responsibleTeam?.name,
            contactEmail: workflowRun.workflow.responsibleTeam?.contactEmail,
          },
          processes: workflowRun.processes,
        },
      };

      await triggerN8nWebhooks(
        workflowRun.workflow.archiveN8nWorkflows.map((w) => w.workflowId),
        submissionContext
      );

      revalidatePath(`/workflows/${workflowRun.workflow.id}`);
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Workflow Ausführung archiviert",
    };
  });
