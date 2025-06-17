"use server";

import prisma from "@/lib/prisma";
import { idSchema } from "@/schemas/id-schema";
import { authActionClient } from "@/server/utils/action-clients";
import { authQuery } from "@/server/utils/auth-query";
import { formatError } from "@/utils/format-error";

import { redirect } from "next/navigation";

export const getWorkflowRuns = async (workflowId: string) => {
  await authQuery();

  const workflow = await prisma.workflowRun.findMany({
    where: { workflowId: workflowId },
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
              schema: true,
            },
          },
          data: true,
        },
      },
    },
  });

  return workflow;
};

/**
 * Type representing the return value of the getWorkflowRuns function
 * @type {WorkflowRun[]}
 */
export type WorkflowRunsProps = Awaited<ReturnType<typeof getWorkflowRuns>>;

/**
 * Initializes a new workflow run with process runs
 */
export const initializeWorkflowRun = authActionClient
  .schema(idSchema)
  .metadata({
    event: "initializeWorkflowRunAction",
  })
  .stateAction(async ({ parsedInput }) => {
    const { id: workflowId } = parsedInput;

    let workflowRunId: string;

    try {
      // Get the workflow with its processes
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        select: {
          id: true,
          processes: {
            select: {
              id: true,
              isCategory: true,
            },
          },
        },
      });

      if (!workflow) {
        throw new Error("Workflow nicht gefunden");
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
    } catch (error) {
      throw formatError(error);
    }

    redirect(`/runs/${workflowRunId}`);
  });
