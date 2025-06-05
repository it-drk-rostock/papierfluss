"use server";

import prisma from "@/lib/prisma";
import { authActionClient } from "@/server/utils/action-clients";
import { authQuery } from "@/server/utils/auth-query";
import { formatError } from "@/utils/format-error";
import { revalidatePath } from "next/cache";
import {
  manageDependenciesSchema,
  processSchema,
  removeDependencySchema,
} from "./_schemas";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { idSchema } from "@/schemas/id-schema";

// Schema for updating process positions and connections
const updateProcessLayoutSchema = z.object({
  workflowId: z.string(),
  processes: z.array(
    z.object({
      id: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
      parentId: z.string().nullable(),
      dependencies: z.array(z.string()),
    })
  ),
});

// Schema for moving a process up or down in its current level
const moveProcessSchema = z.object({
  processId: z.string(),
  direction: z.enum(["up", "down"]),
});

export interface Process {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  isCategory: boolean;
  dependencies: Array<{ id: string; name: string }>;
  dependentProcesses: Array<{ id: string; name: string }>;
  children: Array<{ id: string; name: string }>;
}

/**
 * Gets all processes for a workflow, including their relationships
 */
export const getWorkflowProcesses = async (workflowId: string) => {
  await authQuery();

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: {
      id: true,
      name: true,
      processes: {
        select: {
          id: true,
          name: true,
          description: true,
          parentId: true,
          order: true,
          isCategory: true,
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
  });

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

export const updateProcessLayout = authActionClient
  .schema(updateProcessLayoutSchema)
  .metadata({
    event: "updateProcessLayoutAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { workflowId, processes } = parsedInput;

    try {
      // Update each process
      await Promise.all(
        processes.map((process) =>
          prisma.process.update({
            where: { id: process.id },
            data: {
              position: process.position,
              parentId: process.parentId,
              dependencies: {
                set: process.dependencies.map((id) => ({ id })),
              },
            },
          })
        )
      );
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/workflows/${workflowId}/designer`);

    return {
      message: "Layout gespeichert",
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
