"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";

/**
 * Gets a workflow run
 */
export const getWorkflowRun = async (id: string) => {
  const { user } = await authQuery();

  if (user.role === "admin") {
    return prisma.workflowRun.findUnique({
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
  }

  /* if (!process) return notFound();

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
  } */

  /* return process; */
};

export type WorkflowRunProps = Awaited<ReturnType<typeof getWorkflowRun>>;
