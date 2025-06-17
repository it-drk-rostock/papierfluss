"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import jsonLogic from "json-logic-js";
import { authActionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import { formatError } from "@/utils/format-error";
import { idSchema } from "@/schemas/id-schema";
import { triggerN8nWebhooks } from "@/utils/trigger-n8n-webhooks";

/**
 * Gets a workflow run
 */
export const getWorkflowRun = async (id: string) => {
  const { user } = await authQuery();

  if (user.role === "admin") {
    const workflowRun = await prisma.workflowRun.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        workflow: {
          select: {
            name: true,
            description: true,
            isActive: true,
            isPublic: true,
            submitProcessPermissions: true,
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
        processes: {
          select: {
            id: true,
            data: true,
            status: true,
            startedAt: true,
            completedAt: true,
            submittedBy: {
              select: {
                id: true,
                name: true,
              },
            },
            process: {
              select: {
                id: true,
                name: true,
                description: true,
                isCategory: true,
                order: true,
                schema: true,
                theme: true,
                parentId: true,
                submitProcessPermissions: true,
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
                dependencies: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                dependentProcesses: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                children: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return workflowRun;
  }

  // For non-admin users, we need to check permissions
  const workflowRun = await prisma.workflowRun.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
      workflow: {
        select: {
          name: true,
          description: true,
          isActive: true,
          isPublic: true,
          submitProcessPermissions: true,
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
      processes: {
        select: {
          id: true,
          data: true,
          status: true,
          startedAt: true,
          completedAt: true,
          submittedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          process: {
            select: {
              id: true,
              name: true,
              description: true,
              isCategory: true,
              order: true,
              schema: true,
              theme: true,
              parentId: true,
              submitProcessPermissions: true,
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
              dependencies: {
                select: {
                  id: true,
                  name: true,
                },
              },
              dependentProcesses: {
                select: {
                  id: true,
                  name: true,
                },
              },
              children: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!workflowRun) return null;

  // Check if user has permission to view this workflow run
  const context = {
    user: {
      ...user,
      teams: user.teams?.map((t) => t.name) ?? [],
    },
    workflow: {
      responsibleTeam: workflowRun.workflow.responsibleTeam?.name,
      teams: workflowRun.workflow.teams?.map((t) => t.name) ?? [],
    },
  };

  const rules = JSON.parse(
    workflowRun.workflow.submitProcessPermissions || "{}"
  );
  const hasPermission = await jsonLogic.apply(rules, context);

  if (!hasPermission && !workflowRun.workflow.isPublic) {
    throw new Error("Keine Berechtigung zum Anzeigen dieses Workflow Runs");
  }

  return workflowRun;
};

export type WorkflowRunProps = Awaited<ReturnType<typeof getWorkflowRun>>;

/**
 * Resets a completed process run back to ongoing status.
 *
 * This action:
 * 1. Updates the process run status from 'completed' to 'ongoing'
 * 2. Revalidates the workflow run page to reflect the changes
 *
 * @param {string} id - The ID of the process run to reset
 * @returns {Promise<{ message: string }>} A success message
 * @throws {Error} If:
 *  - User is not authenticated
 *  - Process run is not found
 *  - Process run is not in 'completed' status
 *  - Database operation fails
 */
export const resetProcessRun = authActionClient
  .schema(idSchema)
  .metadata({
    event: "resetProcessRunAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;

    let workflowRunId: string;
    try {
      const processRun = await prisma.processRun.update({
        where: { id },
        data: {
          status: "ongoing",
        },
        select: {
          data: true,
          process: {
            select: {
              name: true,
              description: true,

              responsibleTeam: {
                select: {
                  name: true,
                },
              },
              reactivateN8nWorkflows: {
                select: {
                  workflowId: true,
                },
              },
            },
          },
          workflowRunId: true,
        },
      });
      workflowRunId = processRun.workflowRunId;

      const submissionContext = {
        user: {
          ...ctx.session.user,
          teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
        },
        data: {
          data: processRun.data,
        },
        process: {
          ...processRun.process,
        },
      };

      await triggerN8nWebhooks(
        processRun.process.reactivateN8nWorkflows.map((w) => w.workflowId),
        submissionContext
      );
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/runs/${workflowRunId}`);
    return {
      message: "Prozess zurückgesetzt",
    };
  });
