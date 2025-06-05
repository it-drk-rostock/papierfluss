"use server";

import prisma from "@/lib/prisma";
import { authActionClient } from "@/server/utils/action-clients";
import { authQuery } from "@/server/utils/auth-query";
import { formatError } from "@/utils/format-error";
import { revalidatePath } from "next/cache";
import { processSchema } from "./_schemas";
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
