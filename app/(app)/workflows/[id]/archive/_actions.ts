"use server";

import { WorkflowStatus } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import jsonLogic from "json-logic-js";

export const getArchivedWorkflowRuns = async (
  workflowId: string,
  { search, status }: { search?: string; status?: WorkflowStatus }
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
