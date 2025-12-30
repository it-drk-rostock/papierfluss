"use server";

import prisma from "@/lib/prisma";
import { authActionClient } from "@/server/utils/action-clients";
import { authQuery } from "@/server/utils/auth-query";
import { formatError } from "@/utils/format-error";
import { revalidatePath } from "next/cache";
import {
  manageDependenciesSchema,
  manageSkippableProcessesSchema,
  processSchema,
  removeDependencySchema,
  updateProcessFormSchema,
  moveProcessSchema,
  updateProcessSchema,
  updateProcessPermissionsSchema,
} from "./_schemas";
import { Prisma } from "@/generated/prisma/client";
import jsonLogic from "json-logic-js";
import { idSchema } from "@/schemas/id-schema";
import { forbidden } from "next/navigation";

export interface Process {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  isCategory: boolean;
  dependencies: Array<{ id: string; name: string }>;
  dependentProcesses: Array<{ id: string; name: string }>;
  skippableProcesses: Array<{ id: string; name: string }>;
  skippedByProcesses: Array<{ id: string; name: string }>;
  children: Array<{ id: string; name: string }>;
}

/**
 * Gets all processes for a workflow, including their relationships
 */
export const getWorkflowProcesses = async (workflowId: string) => {
  const { user } = await authQuery();

  if (user.role !== "admin" && user.role !== "moderator") {
    forbidden();
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: {
      id: true,
      name: true,
      description: true,
      information: true,
      editWorkflowPermissions: true,
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
      processes: {
        select: {
          id: true,
          name: true,
          description: true,
          parentId: true,
          order: true,
          isCategory: true,
          schema: true,
          theme: true,
          editProcessPermissions: true,
          submitProcessPermissions: true,
          viewProcessPermissions: true,
          resetProcessPermissions: true,
          skippablePermissions: true,
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
          skippableProcesses: {
            select: {
              id: true,
              name: true,
            },
          },
          skippedByProcesses: {
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
      runs: {
        take: 1,
        orderBy: { startedAt: "asc" },
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
      },
    },
  });

  if (!workflow) {
    throw new Error("Workflow nicht gefunden");
  }

  if (user.role !== "admin") {
    const context = {
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        id: user.id,
        teams: user.teams?.map((t) => t.name) ?? [],
      },
      workflow: {
        responsibleTeam: workflow.responsibleTeam?.name,
        teams: workflow.teams?.map((t) => t.name) ?? [],
      },
    };

    const rules = JSON.parse(workflow.editWorkflowPermissions || "{}");
    const hasPermission = jsonLogic.apply(rules, context);

    if (hasPermission !== true) {
      forbidden();
    }
  }

  return workflow;
};

export type WorkflowProcessesProps = Awaited<
  ReturnType<typeof getWorkflowProcesses>
>;

/**
 * Creates a new process or category in the workflow
 */
export const createProcess = authActionClient
  .schema(processSchema)
  .metadata({
    event: "createProcessAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { name, description, isCategory, parentId, workflowId } = parsedInput;

    try {
      // Get max order for the parent level
      const maxOrderProcess = await prisma.process.findFirst({
        where: {
          workflowId,
          parentId,
        },
        orderBy: {
          order: "desc",
        },
        select: {
          order: true,
        },
      });

      const newOrder = (maxOrderProcess?.order ?? -1) + 1;

      const data: Prisma.ProcessCreateInput = {
        name,
        description,
        isCategory,
        ...(parentId && {
          parent: {
            connect: { id: parentId },
          },
        }),
        order: newOrder,
        workflow: {
          connect: { id: workflowId },
        },
      };

      await prisma.process.create({ data });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/workflows/${workflowId}/designer`);
    return {
      message: isCategory ? "Kategorie erstellt" : "Prozess erstellt",
    };
  });

/**
 * Deletes a process and its children
 */
export const deleteProcess = authActionClient
  .schema(idSchema)
  .metadata({
    event: "deleteProcessAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { id: processId } = parsedInput;

    try {
      const process = await prisma.process.findUnique({
        where: { id: processId },
        select: { workflowId: true },
      });

      if (!process) {
        throw new Error("Prozess nicht gefunden");
      }

      await prisma.process.delete({
        where: { id: processId },
      });

      revalidatePath(`/workflows/${process.workflowId}/designer`);
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Prozess gelöscht",
    };
  });

/**
 * Gets all available processes that can be dependencies for a given process
 */
export const getAvailableDependencies = async (processId: string) => {
  await authQuery();

  const process = await prisma.process.findUnique({
    where: { id: processId },
    select: {
      workflowId: true,
      dependencies: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!process) {
    throw new Error("Process not found");
  }

  // Get all processes in the workflow except the current one and its existing dependencies
  const availableProcesses = await prisma.process.findMany({
    where: {
      workflowId: process.workflowId,
      id: {
        not: processId,
        notIn: process.dependencies.map((d) => d.id),
      },
      isCategory: false,
    },
    select: {
      id: true,
      name: true,
    },
  });

  return availableProcesses;
};

/**
 * Gets all available processes that can be skipped by a given process
 */
export const getAvailableSkippableProcesses = async (processId: string) => {
  await authQuery();

  const process = await prisma.process.findUnique({
    where: { id: processId },
    select: {
      workflowId: true,
      skippableProcesses: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!process) {
    throw new Error("Process not found");
  }

  // Get all processes in the workflow except the current one and its existing skippable processes
  const availableProcesses = await prisma.process.findMany({
    where: {
      workflowId: process.workflowId,
      id: {
        not: processId,
        notIn: process.skippableProcesses.map((s) => s.id),
      },
      isCategory: false,
    },
    select: {
      id: true,
      name: true,
    },
  });

  return availableProcesses;
};

/**
 * Updates the dependencies of a process
 */
export const manageDependencies = authActionClient
  .schema(manageDependenciesSchema)
  .metadata({
    event: "manageDependenciesAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { processId, dependencies } = parsedInput;

    try {
      const process = await prisma.process.findUnique({
        where: { id: processId },
        select: { workflowId: true },
      });

      if (!process) {
        throw new Error("Process not found");
      }

      await prisma.process.update({
        where: { id: processId },
        data: {
          dependencies: {
            set: dependencies.map((dep) => ({ id: dep.id })),
          },
        },
      });

      revalidatePath(`/workflows/${process.workflowId}/designer`);
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Abhängigkeiten aktualisiert",
    };
  });

/**
 * Updates the skippable processes of a process
 */
export const manageSkippableProcesses = authActionClient
  .schema(manageSkippableProcessesSchema)
  .metadata({
    event: "manageSkippableProcessesAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { processId, skippableProcesses } = parsedInput;

    try {
      const process = await prisma.process.findUnique({
        where: { id: processId },
        select: { workflowId: true },
      });

      if (!process) {
        throw new Error("Process not found");
      }

      await prisma.process.update({
        where: { id: processId },
        data: {
          skippableProcesses: {
            set: skippableProcesses.map((skip) => ({ id: skip.id })),
          },
        },
      });

      revalidatePath(`/workflows/${process.workflowId}/designer`);
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Überspringbare Prozesse aktualisiert",
    };
  });

/**
 * Removes a single dependency from a process
 */
export const removeDependency = authActionClient
  .schema(removeDependencySchema)
  .metadata({
    event: "removeDependencyAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { processId, dependencyId } = parsedInput;

    try {
      const process = await prisma.process.findUnique({
        where: { id: processId },
        select: { workflowId: true },
      });

      if (!process) {
        throw new Error("Process not found");
      }

      await prisma.process.update({
        where: { id: processId },
        data: {
          dependencies: {
            disconnect: { id: dependencyId },
          },
        },
      });

      revalidatePath(`/workflows/${process.workflowId}/designer`);
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Abhängigkeiten entfernt",
    };
  });

/**
 * Moves a process up or down in its current level
 */
export const moveProcess = authActionClient
  .schema(moveProcessSchema)
  .metadata({
    event: "moveProcessAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { processId, direction } = parsedInput;

    try {
      // Get the current process and its siblings
      const process = await prisma.process.findUnique({
        where: { id: processId },
        select: {
          workflowId: true,
          parentId: true,
          order: true,
        },
      });

      if (!process) {
        throw new Error("Process not found");
      }

      // Get all siblings (processes at the same level)
      const siblings = await prisma.process.findMany({
        where: {
          workflowId: process.workflowId,
          parentId: process.parentId,
        },
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
          order: true,
        },
      });

      // Find current process index
      const currentIndex = siblings.findIndex((p) => p.id === processId);
      if (currentIndex === -1) {
        throw new Error("Prozess nicht gefunden");
      }

      // Calculate target index
      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      // Check if move is possible
      if (targetIndex < 0 || targetIndex >= siblings.length) {
        throw new Error(
          direction === "up"
            ? "Prozess ist bereits am Anfang"
            : "Prozess ist bereits am Ende"
        );
      }

      // Swap orders with the target process
      const currentOrder = siblings[currentIndex].order;
      const targetOrder = siblings[targetIndex].order;
      const targetId = siblings[targetIndex].id;

      // Perform the swap
      await prisma.$transaction([
        prisma.process.update({
          where: { id: processId },
          data: { order: targetOrder },
        }),
        prisma.process.update({
          where: { id: targetId },
          data: { order: currentOrder },
        }),
      ]);

      revalidatePath(`/workflows/${process.workflowId}/designer`);
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Prozess verschoben",
    };
  });

/**
 * Updates a process form schema and theme
 */
export const updateProcessForm = authActionClient
  .schema(updateProcessFormSchema)
  .metadata({
    event: "updateProcessFormAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id, schema, theme } = parsedInput;

    try {
      const process = await prisma.process.findUnique({
        where: { id },
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
        throw new Error("Process not found");
      }

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
        where: { id },
        data: {
          schema,
          theme,
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/workflows/${id}`);
    return {
      message: "Prozess Formular aktualisiert",
    };
  });

/**
 * Updates a process's basic information
 */
export const updateProcess = authActionClient
  .schema(updateProcessSchema)
  .metadata({
    event: "updateProcessAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { id, name, description } = parsedInput;

    try {
      const process = await prisma.process.findUnique({
        where: { id },
        select: { workflowId: true },
      });

      if (!process) {
        throw new Error("Process not found");
      }

      await prisma.process.update({
        where: { id },
        data: {
          name,
          description,
        },
      });

      revalidatePath(`/workflows/${process.workflowId}/designer`);
    } catch (error) {
      throw formatError(error);
    }

    return {
      message: "Prozess aktualisiert",
    };
  });

/**
 * Updates process permissions
 */
export const updateProcessPermissions = authActionClient
  .schema(updateProcessPermissionsSchema)
  .metadata({
    event: "updateProcessPermissionsAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const {
      id,
      editProcessPermissions,
      submitProcessPermissions,
      viewProcessPermissions,
      resetProcessPermissions,
      skippablePermissions,
    } = parsedInput;

    console.log(skippablePermissions);
    try {
      await prisma.process.update({
        where: { id },
        data: {
          editProcessPermissions,
          submitProcessPermissions,
          viewProcessPermissions,
          resetProcessPermissions,
          skippablePermissions,
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/workflows/${id}/designer`);
    return {
      message: "Prozess Berechtigungen aktualisiert",
    };
  });
