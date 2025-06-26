"use server";

import prisma from "@/lib/prisma";

/**
 * Helper function to get all process run data for a workflow run
 */
export const getAllProcessRunData = async (workflowRunId: string) => {
  const allProcessRuns = await prisma.processRun.findMany({
    where: {
      workflowRunId: workflowRunId,
    },
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
  });

  // Transform the data to be more accessible in webhooks
  const processDataMap: Record<
    string,
    {
      id: string;
      data: Record<string, unknown> | null;
      status: string;
      processName: string;
      processDescription: string | null;
    }
  > = {};
  allProcessRuns.forEach((processRun) => {
    processDataMap[processRun.process.name] = {
      id: processRun.id,
      data: processRun.data as Record<string, unknown> | null,
      status: processRun.status,
      processName: processRun.process.name,
      processDescription: processRun.process.description,
    };
  });

  return {
    allProcessRuns,
    processDataMap,
  };
};
