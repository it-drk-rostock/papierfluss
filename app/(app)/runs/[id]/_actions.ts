"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import jsonLogic from "json-logic-js";

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
