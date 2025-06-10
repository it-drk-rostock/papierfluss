"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";

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
