"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import jsonLogic from "json-logic-js";
import { authActionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import { formatError } from "@/utils/format-error";
import { idSchema } from "@/schemas/id-schema";
import { triggerN8nWebhooks } from "@/utils/trigger-n8n-webhooks";
import { resetProcessRunSchema, saveProcessRunSchema } from "./_schemas";

/**
 * Helper function to get all process run data for a workflow run
 */
const getAllProcessRunData = async (workflowRunId: string) => {
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
            id: true,
            name: true,
            description: true,
            isActive: true,
            isPublic: true,
            submitProcessPermissions: true,
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
        },
        processes: {
          select: {
            id: true,
            data: true,
            status: true,
            resetProcessText: true,
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
          id: true,
          name: true,
          description: true,
          isActive: true,
          isPublic: true,
          submitProcessPermissions: true,
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
      },
      processes: {
        select: {
          id: true,
          data: true,
          status: true,
          resetProcessText: true,
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

/**
 * Resets a completed process run back to ongoing status.
 *
 * This action:
 * 1. Updates the process run status from 'completed' to 'ongoing'
 * 2. Revalidates the workflow run page to reflect the changes
 *
 * @param {string} id - The ID of the process run to reset
 * @returns {Promise<{ message: string }>} A success message
 * @throws {Error} If:
 *  - User is not authenticated
 *  - Process run is not found
 *  - Process run is not in 'completed' status
 *  - Database operation fails
 */
export const resetProcessRun = authActionClient
  .schema(resetProcessRunSchema)
  .metadata({
    event: "resetProcessRunAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id, resetProcessText } = parsedInput;

    let workflowRunId: string;
    try {
      // First, get the current process run to check workflow run status
      const currentProcessRun = await prisma.processRun.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          workflowRunId: true,
          workflowRun: {
            select: {
              id: true,
              status: true,
              workflow: {
                select: {
                  reactivateN8nWorkflows: {
                    select: {
                      workflowId: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!currentProcessRun) {
        throw new Error("Prozess nicht gefunden");
      }

      if (currentProcessRun.status !== "completed") {
        throw new Error("Prozess ist nicht abgeschlossen");
      }

      workflowRunId = currentProcessRun.workflowRunId;
      const workflowRun = currentProcessRun.workflowRun;
      const shouldReactivateWorkflow =
        workflowRun.status === "archived" || workflowRun.status === "completed";

      // Update the process run status
      const processRun = await prisma.processRun.update({
        where: { id, status: "completed" },
        data: {
          status: "ongoing",
          resetProcessText: resetProcessText,
        },
        select: {
          data: true,
          process: {
            select: {
              name: true,
              description: true,
              responsibleTeam: {
                select: {
                  name: true,
                },
              },
              reactivateN8nWorkflows: {
                select: {
                  workflowId: true,
                },
              },
            },
          },
          resetProcessText: true,
          workflowRunId: true,
        },
      });

      // If workflow run was archived or completed, reactivate it
      if (shouldReactivateWorkflow) {
        await prisma.workflowRun.update({
          where: { id: workflowRunId },
          data: {
            status: "ongoing",
          },
        });
      }

      // Get all process run data for the workflow run
      const { processDataMap } = await getAllProcessRunData(workflowRunId);

      const submissionContext = {
        user: {
          ...ctx.session.user,
          teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
        },
        data: {
          data: processRun.data,
          allProcessData: processDataMap,
          resetProcessText: processRun.resetProcessText,
        },
        process: {
          ...processRun.process,
        },
      };

      // Collect all workflow IDs to trigger (process + workflow reactivate workflows)
      const allWorkflowIds = [
        ...processRun.process.reactivateN8nWorkflows.map((w) => w.workflowId),
        ...(shouldReactivateWorkflow
          ? workflowRun.workflow.reactivateN8nWorkflows.map((w) => w.workflowId)
          : []),
      ];

      await triggerN8nWebhooks(allWorkflowIds, submissionContext);
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/runs/${workflowRunId}`);
    return {
      message: "Prozess zurückgesetzt",
    };
  });

/**
 * Completes a process run and checks if all dependencies are completed.
 *
 * This action:
 * 1. Checks if all dependent processes are completed
 * 2. Updates the process run status from 'ongoing' to 'completed'
 * 3. Triggers any complete N8n workflows
 * 4. Revalidates the workflow run page to reflect the changes
 *
 * @param {string} id - The ID of the process run to complete
 * @returns {Promise<{ message: string }>} A success message
 * @throws {Error} If:
 *  - User is not authenticated
 *  - Process run is not found
 *  - Process run is not in 'ongoing' status
 *  - Not all dependent processes are completed
 *  - Database operation fails
 */
export const completeProcessRun = authActionClient
  .schema(idSchema)
  .metadata({
    event: "completeProcessRunAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;

    let workflowRunId: string;
    try {
      // First, get the current process run and its dependencies
      const currentProcessRun = await prisma.processRun.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          status: true,
          workflowRun: {
            select: {
              status: true,
            },
          },
          workflowRunId: true,
          process: {
            select: {
              id: true,
              name: true,
              description: true,
              responsibleTeam: {
                select: {
                  name: true,
                },
              },
              completeN8nWorkflows: {
                select: {
                  workflowId: true,
                },
              },
              dependencies: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!currentProcessRun) {
        throw new Error("Prozess nicht gefunden");
      }

      if (
        currentProcessRun.workflowRun.status === "archived" ||
        currentProcessRun.workflowRun.status === "completed"
      ) {
        throw new Error(
          "Workflow Ausführung ist abgeschlossen oder archiviert"
        );
      }

      if (currentProcessRun.status !== "ongoing") {
        throw new Error("Prozess ist nicht in Bearbeitung");
      }

      // Check if all dependencies are completed
      const dependentProcessIds = currentProcessRun.process.dependencies.map(
        (p) => p.id
      );
      if (dependentProcessIds.length > 0) {
        const dependentProcessRuns = await prisma.processRun.findMany({
          where: {
            workflowRunId: currentProcessRun.workflowRunId,
            processId: { in: dependentProcessIds },
          },
          select: {
            id: true,
            status: true,
            process: {
              select: {
                name: true,
              },
            },
          },
        });

        const incompleteDependencies = dependentProcessRuns.filter(
          (run) => run.status !== "completed"
        );

        if (incompleteDependencies.length > 0) {
          throw new Error(
            `Prozess kann nicht abgeschlossen werden. Die folgenden Abhängigkeiten sind nicht abgeschlossen: ${incompleteDependencies
              .map((run) => run.process.name)
              .join(", ")}`
          );
        }
      }

      // Now update the process run status
      const processRun = await prisma.processRun.update({
        where: { id, status: "ongoing" },
        data: {
          status: "completed",
        },
        select: {
          data: true,
          process: {
            select: {
              name: true,
              description: true,
              responsibleTeam: {
                select: {
                  name: true,
                },
              },
              completeN8nWorkflows: {
                select: {
                  workflowId: true,
                },
              },
            },
          },
          workflowRunId: true,
        },
      });
      workflowRunId = processRun.workflowRunId;

      // Check if all processes in the workflow run are completed
      const allProcessRuns = await prisma.processRun.findMany({
        where: {
          workflowRunId: workflowRunId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      const allProcessesCompleted = allProcessRuns.every(
        (run) => run.status === "completed"
      );

      // If all processes are completed, also complete the workflow run
      if (allProcessesCompleted) {
        await prisma.workflowRun.update({
          where: { id: workflowRunId },
          data: {
            status: "completed",
          },
        });
      }

      // Get all process run data for the workflow run
      const { processDataMap } = await getAllProcessRunData(workflowRunId);

      const submissionContext = {
        user: {
          ...ctx.session.user,
          teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
        },
        data: {
          data: processRun.data,
          allProcessData: processDataMap,
        },
        process: {
          ...processRun.process,
        },
      };

      console.log(processRun.process.completeN8nWorkflows);
      await triggerN8nWebhooks(
        processRun.process.completeN8nWorkflows.map((w) => w.workflowId),
        submissionContext
      );
    } catch (error) {
      console.log(error);
      throw formatError(error);
    }

    revalidatePath(`/runs/${workflowRunId}`);
    return {
      message: "Prozess abgeschlossen",
    };
  });

/**
 * Saves the data for a process run and triggers any save N8n workflows.
 *
 * This action:
 * 1. Validates that the process run exists and is not completed
 * 2. Updates the process run data with the provided form data
 * 3. Triggers any save N8n workflows with the updated data
 * 4. Revalidates the workflow run page to reflect the changes
 *
 * @param {string} id - The ID of the process run to save
 * @param {Record<string, unknown>} data - The form data to save for the process run
 * @returns {Promise<{ message: string }>} A success message
 * @throws {Error} If:
 *  - User is not authenticated
 *  - Process run is not found
 *  - Process run is already completed
 *  - Database operation fails
 *  - N8n webhook calls fail
 */
export const saveProcessRun = authActionClient
  .schema(saveProcessRunSchema)
  .metadata({
    event: "saveProcessRunAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id, data } = parsedInput;

    let workflowRunId: string;
    try {
      // First, get the current process run and its dependencies
      const currentProcessRun = await prisma.processRun.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          status: true,
          workflowRun: {
            select: {
              status: true,
            },
          },
          workflowRunId: true,
          process: {
            select: {
              id: true,
              name: true,
              description: true,
              responsibleTeam: {
                select: {
                  name: true,
                },
              },
              completeN8nWorkflows: {
                select: {
                  workflowId: true,
                },
              },
              dependencies: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!currentProcessRun) {
        throw new Error("Prozess nicht gefunden");
      }

      if (
        currentProcessRun.workflowRun.status === "archived" ||
        currentProcessRun.workflowRun.status === "completed"
      ) {
        throw new Error(
          "Workflow Ausführung ist abgeschlossen oder archiviert"
        );
      }

      if (currentProcessRun.status === "completed") {
        throw new Error("Prozess ist bereits abgeschlossen");
      }

      // Check if all dependencies are completed
      const dependentProcessIds = currentProcessRun.process.dependencies.map(
        (p) => p.id
      );
      if (dependentProcessIds.length > 0) {
        const dependentProcessRuns = await prisma.processRun.findMany({
          where: {
            workflowRunId: currentProcessRun.workflowRunId,
            processId: { in: dependentProcessIds },
          },
          select: {
            id: true,
            status: true,
            process: {
              select: {
                name: true,
              },
            },
          },
        });

        const incompleteDependencies = dependentProcessRuns.filter(
          (run) => run.status !== "completed"
        );

        if (incompleteDependencies.length > 0) {
          throw new Error(
            `Prozess kann nicht abgeschlossen werden. Die folgenden Abhängigkeiten sind nicht abgeschlossen: ${incompleteDependencies
              .map((run) => run.process.name)
              .join(", ")}`
          );
        }
      }

      // Now update the process run status
      const processRun = await prisma.processRun.update({
        where: { id },
        data: {
          resetProcessText: null,
          data,
          status: "ongoing",
          workflowRun: {
            update: {
              status: "ongoing",
            },
          },
        },
        select: {
          data: true,
          process: {
            select: {
              name: true,
              description: true,
              responsibleTeam: {
                select: {
                  name: true,
                },
              },
              saveN8nWorkflows: {
                select: {
                  workflowId: true,
                },
              },
            },
          },
          workflowRunId: true,
        },
      });
      workflowRunId = processRun.workflowRunId;

      // Get all process run data for the workflow run
      const { processDataMap } = await getAllProcessRunData(workflowRunId);

      const submissionContext = {
        user: {
          ...ctx.session.user,
          teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
        },
        data: {
          data: processRun.data,
          allProcessData: processDataMap,
        },
        process: {
          ...processRun.process,
        },
      };

      await triggerN8nWebhooks(
        processRun.process.saveN8nWorkflows.map((w) => w.workflowId),
        submissionContext
      );
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/runs/${workflowRunId}`);
    return {
      message: "Prozess aktualisiert",
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
      // Get the workflow with its processes
      const workflowRun = await prisma.workflowRun.update({
        where: { id },
        data: {
          status: "archived",
        },
        select: {
          workflow: {
            select: {
              name: true,
              description: true,
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
        },
      });

      if (!workflowRun) {
        throw new Error("Workflow Ausführung nicht gefunden");
      }

      const { processDataMap } = await getAllProcessRunData(id);

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
          allProcessData: processDataMap,
        },
      };

      await triggerN8nWebhooks(
        workflowRun.workflow.archiveN8nWorkflows.map((w) => w.workflowId),
        submissionContext
      );
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/runs/${id}`);

    return {
      message: "Workflow Ausführung archiviert",
    };
  });
