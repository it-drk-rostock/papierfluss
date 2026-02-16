"use server";

import { getAllProcessRunData } from "@/app/(app)/runs/[id]/_actions";
import { WorkflowStatus } from "@/generated/prisma/browser";
import prisma from "@/lib/prisma";
import { idSchema } from "@/schemas/id-schema";
import { authActionClient } from "@/server/utils/action-clients";
import { authQuery } from "@/server/utils/auth-query";
import { triggerN8nWebhooks } from "@/utils/trigger-n8n-webhooks";
import jsonLogic from "json-logic-js";
import { revalidatePath } from "next/cache";
import z, { formatError } from "zod";

export const getArchivedWorkflowRuns = async (
  workflowId: string,
  { search, status }: { search?: string; status?: WorkflowStatus },
) => {
  const { user } = await authQuery();

  // Get the workflow data first
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: {
      id: true,
      name: true,
      description: true,
      information: true,
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
      initializeProcess: {
        select: {
          id: true,
          name: true,
          schema: true,
        },
      },
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // Get all workflow runs with their processes
  const allWorkflowRuns = await prisma.workflowRun.findMany({
    take: 100,
    where: {
      workflowId: workflowId,
      isArchived: true,
      ...(status && { status }),
      ...(search &&
        workflow.information && {
          processes: {
            some: {
              OR: (
                workflow.information as { fields: { fieldKey: string }[] }
              ).fields.map((field) => ({
                data: {
                  path: [field.fieldKey],
                  string_contains: search as string,
                  mode: "insensitive",
                },
              })),
            },
          },
        }),
    },
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
      isArchived: true,
      processes: {
        select: {
          id: true,
          status: true,
          process: {
            select: {
              id: true,
              name: true,
              schema: true,
              viewProcessPermissions: true,
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
          data: true,
        },
      },
    },
  });

  // If user is admin, return all workflow runs
  if (user.role === "admin") {
    return {
      workflow,
      runs: allWorkflowRuns,
    };
  }

  // For non-admin users, filter workflow runs based on process permissions
  const filteredWorkflowRuns = allWorkflowRuns.filter((workflowRun) => {
    // Check if user has permission to access at least one process in this workflow run
    return workflowRun.processes.some((processRun) => {
      const process = processRun.process;

      // If process has no submit permissions, deny access
      if (!process.viewProcessPermissions) {
        return false;
      }

      const mergedData = workflowRun.processes.reduce((acc, proc) => {
        if (proc.data) {
          return { ...acc, ...proc.data };
        }
        return acc;
      }, {});

      try {
        const context = {
          user: {
            email: user.email,
            name: user.name,
            role: user.role,
            id: user.id,
            teams: user.teams?.map((t) => t.name) ?? [],
          },
          process: {
            responsibleTeam: process.responsibleTeam?.name,
            teams: process.teams?.map((t) => t.name) ?? [],
          },
          workflow: {
            responsibleTeam: workflow.responsibleTeam?.name,
            teams: workflow.teams?.map((t) => t.name) ?? [],
          },
          data: mergedData,
        };

        const rules = JSON.parse(process.viewProcessPermissions);
        const hasPermission = jsonLogic.apply(rules, context);

        return hasPermission === true;
      } catch (error) {
        // If there's an error parsing permissions, deny access
        console.error("Error checking process permissions:", error);
        return false;
      }
    });
  });

  return {
    workflow,
    runs: filteredWorkflowRuns,
  };
};

/**
 * Type representing the return value of the getWorkflowRuns function
 * @type {WorkflowRun[]}
 */
export type ArchivedWorkflowRunsProps = Awaited<
  ReturnType<typeof getArchivedWorkflowRuns>
>;

/**
 * Archives a workflow run
 */
export const reactivateWorkflowRun = authActionClient
  .schema(idSchema)
  .metadata({
    event: "reactivateWorkflowRunAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;

    try {
      const workflowRun = await prisma.workflowRun.findUnique({
        where: { id },
        select: {
          workflow: {
            select: {
              id: true,
              name: true,
              description: true,
              submitProcessPermissions: true,
              teams: {
                select: {
                  name: true,
                  contactEmail: true,
                },
              },
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
          workflow: {
            responsibleTeam: workflowRun.workflow.responsibleTeam?.name,
            teams: workflowRun.workflow.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(
          workflowRun.workflow.submitProcessPermissions || "{}",
        );
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error(
            "Keine Berechtigung zum Reaktivieren dieser Workflow Ausführung",
          );
        }
      }
      await prisma.workflowRun.update({
        where: {
          id,
        },
        data: {
          isArchived: false,
          archivedNotes: null,
          archivedAt: null,
        },
      });

      if (!workflowRun) {
        throw new Error("Workflow Ausführung nicht gefunden");
      }

      // Get all process run data for the workflow run
      const { allProcessRuns: allProcessRunsData, allProcessDataOnly } =
        await getAllProcessRunData(id);

      const submissionContext = {
        user: {
          ...ctx.session.user,
        },
        data: {
          currentProcessData: {},
          allProcessData: allProcessRunsData,
          allProcessDataOnly: allProcessDataOnly,
        },
        workflow: {
          name: workflowRun.workflow.name,
          description: workflowRun.workflow.description,
          responsibleTeam: workflowRun.workflow.responsibleTeam?.name,
          teams: workflowRun.workflow.teams ?? [],
        },
        workflowRun: {
          id: id,
        },
        activeProcess: {},
      };

      await triggerN8nWebhooks(
        workflowRun.workflow.archiveN8nWorkflows.map((w) => w.workflowId),
        submissionContext,
      );

      revalidatePath(`/workflows/${workflowRun.workflow.id}`);
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Workflow Ausführung reaktiviert",
    };
  });
