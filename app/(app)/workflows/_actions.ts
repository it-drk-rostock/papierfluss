"use server";

import { authActionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import {
  assignTeamsSchema,
  removeTeamSchema,
  updateWorkflowSchema,
  workflowSchema,
  workflowInformationSchema,
} from "./_schemas";
import prisma from "@/lib/prisma";
import { formatError } from "@/utils/format-error";
import { authQuery } from "@/server/utils/auth-query";
import { idSchema } from "@/schemas/id-schema";
import jsonLogic from "json-logic-js";

export const getWorkflowProcesses = async (id: string, search?: string) => {
  const { user } = await authQuery();

  const whereClause = {
    workflowId: id,
    ...(search ? {
      name: {
        contains: search,
        mode: 'insensitive' as const,
      },
    } : {}),
  };

  if (user.role === "admin") {
    return prisma.process.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
      },
    });
  }

  const processes = await prisma.process.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
    },
  });

  return processes;
};

export type ProcessProps = Awaited<ReturnType<typeof getWorkflowProcesses>>;

/**
 * Creates a new form in the database.
 *
 * The function:
 * 1. Creates a new form in the database.
 * 2. Revalidates the form cache tag to ensure data consistency.
 * 3. Redirects to the form list page upon completion.
 *
 * @throws {Error} If user is not authenticated or if any database operation fails
 */
export const createWorkflow = authActionClient
  .schema(workflowSchema)
  .metadata({
    event: "createWorkflowAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const {
      name,
      description,
      isPublic,
      isActive,
      responsibleTeam,
      initializeProcess,
    } = parsedInput;

    try {
      if (
        ctx.session.user.role !== "admin" &&
        ctx.session.user.role !== "moderator"
      ) {
        throw new Error("Keine Berechtigung zum Erstellen von Workflows");
      }
      await prisma.workflow.create({
        data: {
          name,
          description,
          isPublic,
          isActive,
          editWorkflowPermissions: "true",
          submitProcessPermissions: "true",
          ...(initializeProcess?.id && {
            initializeProcessId: initializeProcess.id,
          }),
          ...(responsibleTeam?.id && {
            responsibleTeamId: responsibleTeam.id,
          }),
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/workflows");
    return {
      message: "Workflow erstellt",
    };
  });

/**
 * Updates an existing form in the database.
 *
 * The function:
 * 1. Updates the form in the database.
 * 2. Revalidates the form cache tag to ensure data consistency.
 * 3. Redirects to the form list page upon completion.
 *
 * @throws {Error} If user is not authenticated or if any database operation fails
 */
export const updateWorkflow = authActionClient
  .schema(updateWorkflowSchema)
  .metadata({
    event: "updateWorkflowAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const {
      id,
      name,
      description,
      isPublic,
      isActive,
      editWorkflowPermissions,
      submitProcessPermissions,
      responsibleTeam,
      initializeProcess,
    } = parsedInput;

    try {
      // Check if user has moderator or admin role
      if (
        ctx.session.user.role !== "admin" &&
        ctx.session.user.role !== "moderator"
      ) {
        throw new Error("Keine Berechtigung zum Bearbeiten von Workflows");
      }

      const workflow = await prisma.workflow.findUnique({
        where: { id },
        select: {
          editWorkflowPermissions: true,
          teams: true,
          responsibleTeam: true,
        },
      });

      if (!workflow) {
        throw new Error("Workflow nicht gefunden");
      }

      // Only check permissions if user is not admin
      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            ...ctx.session.user,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          form: {
            responsibleTeam: workflow.responsibleTeam?.name,
            teams: workflow.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(workflow.editWorkflowPermissions || "{}");

        const hasPermission = jsonLogic.apply(rules, context);

        if (!hasPermission) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Workflows");
        }
      }

      await prisma.workflow.update({
        where: { id },
        data: {
          name,
          description,
          isPublic,
          isActive,
          editWorkflowPermissions,
          submitProcessPermissions,
          ...(initializeProcess?.id && {
            initializeProcessId: initializeProcess.id,
          }),
          responsibleTeamId: responsibleTeam?.id,
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/workflows");
    return {
      message: "Workflow aktualisiert",
    };
  });

/**
 * Deletes a user from the database
 * @param {Object} options.parsedInput - The validated input data
 * @param {string} options.parsedInput.id - The ID of the form to delete
 * @returns {Promise<void>}
 * @throws {Error} If the delete operation fails
 */
export const deleteWorkflow = authActionClient
  .schema(idSchema)
  .metadata({
    event: "deleteWorkflowAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;
    try {
      // Check if user has moderator or admin role
      if (
        ctx.session.user.role !== "admin" &&
        ctx.session.user.role !== "moderator"
      ) {
        throw new Error("Keine Berechtigung zum Bearbeiten von Workflows");
      }

      const workflow = await prisma.workflow.findUnique({
        where: { id },
        select: {
          editWorkflowPermissions: true,
          teams: true,
          responsibleTeam: {
            select: {
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
        // Do permission check for moderators
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

        const rules = JSON.parse(workflow.editWorkflowPermissions || "{}");
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error("Keine Berechtigung zum Löschen dieses Workflows");
        }
      }

      await prisma.workflow.delete({
        where: { id },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/workflows");
    return {
      message: "Workflow gelöscht",
    };
  });

/**
 * Retrieves forms from the database based on user's role and access permissions.
 *
 * Access rules:
 * - Admin users: Can access all forms
 * - Regular users: Can access:
 *   1. All public forms
 *   2. Forms where the user belongs to an assigned team
 *
 * Note: Results are automatically deduplicated if a form matches multiple conditions
 *
 * @returns {Promise<Array<{
 *   id: string;
 *   title: string;
 *   description: string | null;
 *   icon: string | null;
 *   schema: any;
 *   isActive: boolean;
 *   isPublic: boolean;
 * }>>} Array of form objects matching the access criteria
 * @throws {Error} If the query fails or if the user is not authorized
 */
export const getWorkflows = async () => {
  const { user } = await authQuery();

  if (user.role === "admin") {
    return prisma.workflow.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        isPublic: true,
        editWorkflowPermissions: true,
        submitProcessPermissions: true,
        initializeProcess: {
          select: {
            id: true,
            name: true,
            schema: true,
          },
        },
        responsibleTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        teams: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
          },
        },
      },
    });
  }

  const workflows = await prisma.workflow.findMany({
    where: {
      OR: [
        { isPublic: true },
        {
          teams: {
            some: {
              users: {
                some: { id: user.id },
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      isPublic: true,
      editWorkflowPermissions: true,
      submitProcessPermissions: true,
      initializeProcess: {
        select: {
          id: true,
          name: true,
          schema: true,
        },
      },
      responsibleTeam: {
        select: {
          id: true,
          name: true,
        },
      },
      teams: {
        select: {
          id: true,
          name: true,
          contactEmail: true,
        },
      },
    },
  });

  return workflows;
};

export type WorkflowProps = Awaited<ReturnType<typeof getWorkflows>>;

export const removeTeam = authActionClient
  .schema(removeTeamSchema)
  .metadata({
    event: "removeTeamAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { teamId, id } = parsedInput;
    try {
      // Check if user has moderator or admin role
      if (
        ctx.session.user.role !== "admin" &&
        ctx.session.user.role !== "moderator"
      ) {
        throw new Error("Keine Berechtigung zum Bearbeiten von Workflows");
      }

      const workflow = await prisma.workflow.findUnique({
        where: { id },
        select: {
          editWorkflowPermissions: true,
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

        const rules = JSON.parse(workflow.editWorkflowPermissions || "{}");
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Workflows");
        }
      }

      await prisma.workflow.update({
        where: {
          id,
        },
        data: {
          teams: {
            disconnect: { id: teamId },
          },
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/workflows");

    return {
      message: "Bereich entfernt",
    };
  });

export const assignTeams = authActionClient
  .schema(assignTeamsSchema)
  .metadata({
    event: "assignTeamsAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { teams, id } = parsedInput;
    try {
      // Check if user has moderator or admin role
      if (
        ctx.session.user.role !== "admin" &&
        ctx.session.user.role !== "moderator"
      ) {
        throw new Error("Keine Berechtigung zum Bearbeiten von Workflows");
      }

      const workflow = await prisma.workflow.findUnique({
        where: { id },
        select: {
          editWorkflowPermissions: true,
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

        const rules = JSON.parse(workflow.editWorkflowPermissions || "{}");
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Workflows");
        }
      }
      await prisma.workflow.update({
        where: {
          id,
        },
        data: {
          teams: {
            connect: teams.map((team) => ({ id: team.id })),
          },
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/workflows");

    return {
      message: "Bereiche hinzugefügt",
    };
  });

export const getAvailableTeams = async (workflowId: string) => {
  await authQuery();
  const teams = await prisma.team.findMany({
    where: {
      workflows: {
        none: {
          id: workflowId,
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  return teams;
};

/**
 * Gets workflow information configuration
 */
export const getWorkflowInformation = async (workflowId: string) => {
  await authQuery();

  // Get the workflow with basic info
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

  // Get the latest workflow run with process runs
  const latestWorkflowRun = await prisma.workflowRun.findFirst({
    where: { workflowId, status: "completed" },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      processes: {
        select: {
          id: true,
          data: true,
          process: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return {
    ...workflow,
    latestWorkflowRun,
  };
};

/**
 * Updates workflow information configuration
 */
export const updateWorkflowInformation = authActionClient
  .schema(workflowInformationSchema.extend(idSchema.shape))
  .metadata({
    event: "updateWorkflowInformationAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id, fields } = parsedInput;

    try {
      const workflow = await prisma.workflow.findUnique({
        where: { id },
        select: {
          editWorkflowPermissions: true,
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
        throw new Error("Workflow nicht gefunden");
      }

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

        const rules = JSON.parse(workflow.editWorkflowPermissions || "{}");
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Workflows");
        }
      }
      await prisma.workflow.update({
        where: { id },
        data: {
          information: { fields },
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/workflows/${id}/designer`);
    return {
      message: "Workflow Informationen aktualisiert",
    };
  });

/**
 * Gets workflow runs for a specific workflow to provide data for permission builder
 */
export const getWorkflowRunsForPermissions = async (workflowId: string) => {
  await authQuery();

  const workflowRuns = await prisma.workflowRun.findMany({
    where: { workflowId, status: "completed" },
    select: {
      id: true,
      processes: {
        select: {
          data: true,
          process: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    take: 10, // Limit to last 10 runs to avoid performance issues
    orderBy: {
      startedAt: "desc",
    },
  });

  // Transform the data to match the expected type
  return workflowRuns.map((run) => ({
    id: run.id,
    processes: run.processes.map((process) => ({
      data: process.data as Record<string, unknown> | null,
      process: {
        name: process.process.name,
      },
    })),
  }));
};
