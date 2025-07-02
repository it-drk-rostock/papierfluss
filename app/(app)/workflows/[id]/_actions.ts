"use server";

import prisma from "@/lib/prisma";
import { idSchema } from "@/schemas/id-schema";
import { authActionClient } from "@/server/utils/action-clients";
import { authQuery } from "@/server/utils/auth-query";
import { formatError } from "@/utils/format-error";
import { triggerN8nWebhooks } from "@/utils/trigger-n8n-webhooks";
import { revalidatePath } from "next/cache";
import jsonLogic from "json-logic-js";

import { redirect } from "next/navigation";

export const getWorkflowRuns = async (
  workflowId: string,
  search?: string | Record<string, string>
) => {
  const { user } = await authQuery();

  console.log(search);

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
    },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  // Get all workflow runs with their processes
  const allWorkflowRuns = await prisma.workflowRun.findMany({
    where: {
      workflowId: workflowId,
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
      if (!process.submitProcessPermissions) {
        return false;
      }

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
          data: processRun.data || {},
        };

        const rules = JSON.parse(process.submitProcessPermissions);
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
export type WorkflowRunsProps = Awaited<ReturnType<typeof getWorkflowRuns>>;

export type WorkflowRunsSearchParams = {
  search: string;
};

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
          submitProcessPermissions: true,
          teams: {
            select: {
              name: true,
            },
          },
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
            responsibleTeam: workflow.responsibleTeam?.name,
            teams: workflow.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(workflow.submitProcessPermissions || "{}");
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error("Keine Berechtigung zum Ausführen dieses Workflows");
        }
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
      const workflowRun = await prisma.workflowRun.findUnique({
        where: { id },
        select: {
          workflow: {
            select: {
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
          workflowRun.workflow.submitProcessPermissions || "{}"
        );
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error(
            "Keine Berechtigung zum Löschen dieser Workflow Ausführung"
          );
        }
      }
      const workflow = await prisma.workflowRun.delete({
        where: {
          id,
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
          workflowRun.workflow.submitProcessPermissions || "{}"
        );
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error(
            "Keine Berechtigung zum Archivieren dieser Workflow Ausführung"
          );
        }
      }
      await prisma.workflowRun.update({
        where: {
          id,
        },
        data: {
          status: "archived",
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
