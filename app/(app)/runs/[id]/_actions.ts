"use server";

import prisma from "@/lib/prisma";
import { authQuery } from "@/server/utils/auth-query";
import jsonLogic from "json-logic-js";
import { authActionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import { formatError } from "@/utils/format-error";
import { idSchema } from "@/schemas/id-schema";
import { triggerN8nWebhooks } from "@/utils/trigger-n8n-webhooks";
import {
  resetProcessRunSchema,
  saveProcessRunInformationSchema,
  saveProcessRunSchema,
} from "./_schemas";
import { forbidden } from "next/navigation";
import type { JsonValue } from "@prisma/client/runtime/library";
import { validateSurveyData } from "@/utils/validate-survey-data";

/**
 * Helper function to get all process run data for a workflow run
 */
export const getAllProcessRunData = async (workflowRunId: string) => {
  const allProcessRunsRaw = await prisma.processRun.findMany({
    where: {
      workflowRunId: workflowRunId,
    },
    select: {
      id: true,
      data: true,
      status: true,
      process: {
        select: {
          isCategory: true,
          id: true,
          name: true,
          description: true,
          order: true,
          parentId: true,
        },
      },
    },
  });

  // Build hierarchical order (parent -> children), sorting siblings by process.order
  const childrenMap = new Map<string | null, typeof allProcessRunsRaw>();
  for (const run of allProcessRunsRaw) {
    const parentId = run.process.parentId;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, [] as unknown as typeof allProcessRunsRaw);
    }
    childrenMap.get(parentId)!.push(run);
  }

  // Sort children of every parent by order, then name, then id for stability
  childrenMap.forEach((children) => {
    children.sort((a, b) => {
      const orderA = a.process.order ?? 0;
      const orderB = b.process.order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      if (a.process.name !== b.process.name)
        return a.process.name.localeCompare(b.process.name);
      return a.process.id.localeCompare(b.process.id);
    });
  });

  const flatten = (parentId: string | null): typeof allProcessRunsRaw => {
    const siblings =
      childrenMap.get(parentId) || ([] as unknown as typeof allProcessRunsRaw);
    const result: typeof allProcessRunsRaw =
      [] as unknown as typeof allProcessRunsRaw;
    for (const s of siblings) {
      result.push(s);
      const desc = flatten(s.process.id);
      if (desc.length) result.push(...desc);
    }
    return result;
  };

  const allProcessRuns = flatten(null);

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

  const allProcessDataOnly = Object.assign(
    {},
    ...allProcessRuns
      .filter((p) => p.data && typeof p.data === "object")
      .map((p) => p.data as Record<string, unknown>)
  );

  return {
    allProcessRuns,
    processDataMap,
    allProcessDataOnly,
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
        isArchived: true,
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
            information: true,
            informationData: true,
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
                viewProcessPermissions: true,
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

    // Process information fields on the server side (admin)
    if (workflowRun && workflowRun.workflow.information) {
      const info = workflowRun.workflow.information as {
        fields?: Array<{ label: string; fieldKey: string }>;
      };

      if (info.fields) {
        const processedFields = info.fields.map((field) => {
          // Search through all process runs to find the field data
          for (const processRun of workflowRun.processes) {
            if (
              processRun.data &&
              typeof processRun.data === "object" &&
              processRun.data !== null
            ) {
              const data = processRun.data as Record<string, unknown>;
              if (
                field.fieldKey in data &&
                data[field.fieldKey] !== null &&
                data[field.fieldKey] !== undefined
              ) {
                return {
                  ...field,
                  data: {
                    value:
                      data[field.fieldKey] === null ||
                      data[field.fieldKey] === undefined
                        ? ""
                        : String(data[field.fieldKey]),
                    processName: processRun.process.name,
                  },
                };
              }
            }
          }
          return {
            ...field,
            data: null,
          };
        });

        // Overwrite information fields with processed results
        // Note: we keep it JSON-compatible (values as strings)
        workflowRun.workflow.information = {
          fields: processedFields,
        } as unknown as JsonValue;
      }
    }

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
      isArchived: true,
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
          information: true,
          informationData: true,
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
              viewProcessPermissions: true,
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
  // Allow if the workflow is public OR if the user has view permission for at least one process
  const hasAnyProcessPermission = workflowRun.processes.some((processRun) => {
    const process = processRun.process;

    // If process has no submit permissions, deny access for this process
    if (!process.viewProcessPermissions) {
      return false;
    }

    const allProcessData = Object.assign(
      {},
      ...workflowRun.processes
        .filter((p) => p.data && typeof p.data === "object")
        .map((p) => p.data)
    );

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
          responsibleTeam: workflowRun.workflow.responsibleTeam?.name,
          teams: workflowRun.workflow.teams?.map((t) => t.name) ?? [],
        },
        data: allProcessData || {},
      };

      const rules = JSON.parse(process.viewProcessPermissions);
      const hasPermission = jsonLogic.apply(rules, context);
      return hasPermission === true;
    } catch {
      // If there's an error parsing permissions, deny access for this process
      return false;
    }
  });

  if (!hasAnyProcessPermission) {
    forbidden();
  }

  // Compute information fields BEFORE view-permission filtering for non-admins
  if (workflowRun && workflowRun.workflow.information) {
    try {
      const info = workflowRun.workflow.information as {
        fields?: Array<{ label: string; fieldKey: string }>;
      };
      const processedFields = (info.fields ?? []).map((field) => {
        for (const processRun of workflowRun.processes) {
          if (
            processRun.data &&
            typeof processRun.data === "object" &&
            processRun.data !== null
          ) {
            const data = processRun.data as Record<string, unknown>;
            if (
              Object.prototype.hasOwnProperty.call(data, field.fieldKey) &&
              data[field.fieldKey] !== undefined &&
              data[field.fieldKey] !== null
            ) {
              return {
                ...field,
                data: {
                  value: String(data[field.fieldKey]),
                  processName: processRun.process.name,
                },
              };
            }
          }
        }
        return { ...field, data: null };
      });
      workflowRun.workflow.information = {
        fields: processedFields,
      } as unknown as JsonValue;
    } catch {
      // leave information as-is if processing fails
    }
  }

  // Apply view permissions filtering for regular users (not admins)
  if (user.role === "user" || user.role === "moderator") {
    // Get all process data for permission context
    const allProcessData = Object.assign(
      {},
      ...workflowRun.processes
        .filter((p) => p.data && typeof p.data === "object")
        .map((p) => p.data)
    );

    // Filter processes based on view permissions
    workflowRun.processes = workflowRun.processes.map((processRun) => {
      const process = processRun.process;

      // If no view permissions are set, allow view (backward compatibility)
      if (!process.viewProcessPermissions) {
        return processRun;
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
            responsibleTeam: workflowRun.workflow.responsibleTeam?.name,
            teams: workflowRun.workflow.teams?.map((t) => t.name) ?? [],
          },
          data: allProcessData,
        };

        const rules = JSON.parse(process.viewProcessPermissions);
        const hasViewPermission = jsonLogic.apply(rules, context);

        // If user doesn't have view permission, remove schema and data
        if (hasViewPermission !== true) {
          return {
            ...processRun,
            data: null,
            process: {
              ...process,
              schema: null,
            },
          };
        }

        return processRun;
      } catch {
        return {
          ...processRun,
          data: null,
          process: {
            ...process,
            schema: null,
          },
        };
      }
    });
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
          process: {
            select: {
              resetProcessPermissions: true,
              name: true,
            },
          },
          workflowRunId: true,
          workflowRun: {
            select: {
              isArchived: true,
              processes: {
                select: {
                  data: true,
                },
              },
              id: true,
              status: true,
              workflow: {
                select: {
                  responsibleTeam: {
                    select: {
                      name: true,
                      contactEmail: true,
                    },
                  },
                  teams: {
                    select: {
                      name: true,
                      contactEmail: true,
                    },
                  },
                  name: true,
                  description: true,
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

      const allProcessData = Object.assign(
        {},
        ...currentProcessRun.workflowRun.processes
          .filter((p) => p.data && typeof p.data === "object")
          .map((p) => p.data)
      );

      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            email: ctx.session.user.email,
            name: ctx.session.user.name,
            role: ctx.session.user.role,
            id: ctx.session.user.id,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          data: allProcessData,
          process: {
            responsibleTeam:
              currentProcessRun.workflowRun.workflow.responsibleTeam?.name,
            teams:
              currentProcessRun.workflowRun.workflow.teams?.map(
                (t) => t.name
              ) ?? [],
          },
        };

        const rules = JSON.parse(
          currentProcessRun.process.resetProcessPermissions || "{}"
        );
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error(
            "Keine Berechtigung zum Zurücksetzen dieses Prozesses"
          );
        }
      }

      workflowRunId = currentProcessRun.workflowRunId;
      const workflowRun = currentProcessRun.workflowRun;
      const shouldReactivateWorkflow =
        workflowRun.isArchived || workflowRun.status === "completed";

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
            isArchived: false,
            status: "ongoing",
          },
        });
      }

      // Get all process run data for the workflow run
      const { allProcessRuns: allProcessRunsData, allProcessDataOnly } =
        await getAllProcessRunData(workflowRunId);

      const submissionContext = {
        user: {
          ...ctx.session.user,
        },
        data: {
          currentProcessData: processRun.data,
          allProcessData: allProcessRunsData,
          allProcessDataOnly: allProcessDataOnly,
          resetProcessText: resetProcessText,
        },
        workflow: {
          name: currentProcessRun.workflowRun.workflow.name,
          description: currentProcessRun.workflowRun.workflow.description,
          responsibleTeam:
            currentProcessRun.workflowRun.workflow.responsibleTeam?.name,
          teams: currentProcessRun.workflowRun.workflow.teams ?? [],
        },
        workflowRun: {
          id: workflowRunId,
        },
        activeProcess: processRun.process,
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
              isArchived: true,
              status: true,
              processes: {
                select: {
                  data: true,
                },
              },
              workflow: {
                select: {
                  name: true,
                  description: true,
                  responsibleTeam: {
                    select: {
                      name: true,
                    },
                  },
                  teams: {
                    select: {
                      name: true,
                      contactEmail: true,
                    },
                  },
                  lastN8nWorkflows: {
                    select: {
                      workflowId: true,
                    },
                  },
                },
              },
            },
          },
          data: true,
          workflowRunId: true,
          process: {
            select: {
              id: true,
              name: true,
              description: true,
              submitProcessPermissions: true,
              skippablePermissions: true,
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
              skippableProcesses: {
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

      const allProcessData = Object.assign(
        {},
        ...currentProcessRun.workflowRun.processes
          .filter((p) => p.data && typeof p.data === "object")
          .map((p) => p.data)
      );

      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            email: ctx.session.user.email,
            name: ctx.session.user.name,
            role: ctx.session.user.role,
            id: ctx.session.user.id,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          data: allProcessData,
          process: {
            responsibleTeam:
              currentProcessRun.workflowRun.workflow.responsibleTeam?.name,
            teams:
              currentProcessRun.workflowRun.workflow.teams?.map(
                (t) => t.name
              ) ?? [],
          },
        };

        const rules = JSON.parse(
          currentProcessRun.process.submitProcessPermissions || "{}"
        );
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error(
            "Keine Berechtigung zum Abschließen dieses Prozesses"
          );
        }
      }

      if (
        currentProcessRun.workflowRun.isArchived ||
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
          completedAt: new Date(),
          resetProcessText: null,
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

      // Handle skippable processes after completing the current process
      if (currentProcessRun.process.skippableProcesses.length > 0) {
        try {
          const skippableProcessIds =
            currentProcessRun.process.skippableProcesses.map((p) => p.id);

          // Get skippable process runs that are still open or ongoing
          const skippableProcessRuns = await prisma.processRun.findMany({
            where: {
              workflowRunId: workflowRunId,
              processId: { in: skippableProcessIds },
              status: { in: ["open", "ongoing"] },
            },
            select: {
              id: true,
              status: true,
              processId: true,
              process: {
                select: {
                  name: true,
                },
              },
            },
          });

          // Only proceed if there are active skippable process runs
          if (skippableProcessRuns.length > 0) {
            // Get all current process data for permission evaluation
            const { processDataMap: allProcessData } =
              await getAllProcessRunData(workflowRunId);

            // Determine if processes should be skipped based on permissions
            let shouldSkipAll = true; // Default to skip when no permissions defined

            if (currentProcessRun.process.skippablePermissions) {
              try {
                const rules = JSON.parse(
                  currentProcessRun.process.skippablePermissions
                );
                const flattenedCurrentData =
                  processRun.data && typeof processRun.data === "object"
                    ? (processRun.data as Record<string, unknown>)
                    : {};
                const permissionContext = {
                  user: {
                    ...ctx.session.user,
                    teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
                  },
                  data: {
                    ...flattenedCurrentData, // Flatten current process data for JsonLogic
                    currentProcessData: processRun.data,
                    allProcessData: allProcessData,
                  },
                  process: {
                    responsibleTeam:
                      currentProcessRun.workflowRun.workflow.responsibleTeam
                        ?.name,
                    teams:
                      currentProcessRun.workflowRun.workflow.teams?.map(
                        (t) => t.name
                      ) ?? [],
                  },
                  workflow: {
                    name: currentProcessRun.workflowRun.workflow.name,
                    description:
                      currentProcessRun.workflowRun.workflow.description,
                  },
                };

                shouldSkipAll =
                  jsonLogic.apply(rules, permissionContext) === true;
              } catch {
                // If permission evaluation fails, default to not skipping
                shouldSkipAll = false;
              }
            }

            // Bulk update all skippable processes to completed if permission check passed
            if (shouldSkipAll) {
              const processesToSkip = skippableProcessRuns.map((run) => run.id);
              await prisma.processRun.updateMany({
                where: {
                  id: { in: processesToSkip },
                  status: { in: ["open", "ongoing"] }, // Safety check
                },
                data: {
                  status: "completed",
                  resetProcessText: null,
                },
              });
            }
          }
        } catch (skippableError) {
          // Silently continue if skippable logic fails - don't break main flow
          console.error("Error in skippable processes logic:", skippableError);
        }
      }

      // Check if all processes in the workflow run are completed
      const allProcessRuns = await prisma.processRun.findMany({
        where: {
          workflowRunId: workflowRunId,
          process: {
            isCategory: false,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      const activeProcesses = allProcessRuns.filter(
        (run) => run.status === "open" || run.status === "ongoing"
      );
      const allProcessesCompleted = allProcessRuns.every(
        (run) => run.status === "completed"
      );

      // Check if only one process remains (open or ongoing)
      const onlyOneProcessRemains = activeProcesses.length === 1;

      // If all processes are completed, also complete the workflow run
      if (allProcessesCompleted) {
        await prisma.workflowRun.update({
          where: { id: workflowRunId },
          data: {
            status: "completed",
            completedAt: new Date(),
          },
        });
      }

      // Get all process run data for the workflow run
      const { allProcessRuns: allProcessRunsData, allProcessDataOnly } =
        await getAllProcessRunData(workflowRunId);

      const submissionContext = {
        user: {
          ...ctx.session.user,
        },
        data: {
          currentProcessData: processRun.data,
          allProcessData: allProcessRunsData,
          allProcessDataOnly: allProcessDataOnly,
        },
        workflow: {
          name: currentProcessRun.workflowRun.workflow.name,
          description: currentProcessRun.workflowRun.workflow.description,
          responsibleTeam:
            currentProcessRun.workflowRun.workflow.responsibleTeam?.name,
          teams: currentProcessRun.workflowRun.workflow.teams ?? [],
        },
        workflowRun: {
          id: workflowRunId,
        },
        activeProcess: processRun.process,
      };

      await triggerN8nWebhooks(
        processRun.process.completeN8nWorkflows.map((w) => w.workflowId),
        submissionContext
      );

      // Trigger lastN8nWorkflows if only one process remains
      if (onlyOneProcessRemains) {
        await triggerN8nWebhooks(
          currentProcessRun.workflowRun.workflow.lastN8nWorkflows.map(
            (w) => w.workflowId
          ),
          submissionContext
        );
      }
    } catch (error) {
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
              isArchived: true,
              processes: {
                select: {
                  data: true,
                },
              },
              status: true,
              workflow: {
                select: {
                  name: true,
                  description: true,
                  teams: {
                    select: {
                      name: true,
                    },
                  },
                  responsibleTeam: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          workflowRunId: true,
          process: {
            select: {
              submitProcessPermissions: true,
              id: true,
              name: true,
              description: true,
              schema: true,
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

      const validatedData = await validateSurveyData(
        currentProcessRun.process.schema,
        { ...data },
        { strict: true }
      );

      if (!validatedData.valid) {
        throw new Error(
          validatedData.errors
            .map((e: { message: string }) => e.message)
            .join(", ")
        );
      }

      const allProcessData = Object.assign(
        {},
        ...currentProcessRun.workflowRun.processes
          .filter((p) => p.data && typeof p.data === "object")
          .map((p) => p.data)
      );

      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            email: ctx.session.user.email,
            name: ctx.session.user.name,
            role: ctx.session.user.role,
            id: ctx.session.user.id,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          data: allProcessData,
          process: {
            responsibleTeam:
              currentProcessRun.workflowRun.workflow.responsibleTeam?.name,
            teams:
              currentProcessRun.workflowRun.workflow.teams?.map(
                (t) => t.name
              ) ?? [],
          },
        };

        const rules = JSON.parse(
          currentProcessRun.process.submitProcessPermissions || "{}"
        );
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error(
            "Keine Berechtigung zum Abschließen dieses Prozesses"
          );
        }
      }

      if (
        currentProcessRun.workflowRun.isArchived ||
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
      const { allProcessRuns: allProcessRunsData, allProcessDataOnly } =
        await getAllProcessRunData(workflowRunId);

      const submissionContext = {
        user: {
          ...ctx.session.user,
        },
        data: {
          currentProcessData: processRun.data,
          allProcessData: allProcessRunsData,
          allProcessDataOnly: allProcessDataOnly,
        },
        workflow: {
          name: currentProcessRun.workflowRun.workflow.name,
          description: currentProcessRun.workflowRun.workflow.description,
          responsibleTeam:
            currentProcessRun.workflowRun.workflow.responsibleTeam?.name,
          teams: currentProcessRun.workflowRun.workflow.teams ?? [],
        },
        workflowRun: {
          id: workflowRunId,
        },
        activeProcess: processRun.process,
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
export const saveProcessRunInformation = authActionClient
  .schema(saveProcessRunInformationSchema)
  .metadata({
    event: "saveProcessRunInformationAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id, informationData } = parsedInput;

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
          information: true,
          informationData: true,
          workflowRun: {
            select: {
              isArchived: true,
              processes: {
                select: {
                  data: true,
                },
              },
              status: true,
              workflow: {
                select: {
                  name: true,
                  description: true,
                  teams: {
                    select: {
                      name: true,
                    },
                  },
                  responsibleTeam: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          workflowRunId: true,
          process: {
            select: {
              submitProcessPermissions: true,
              id: true,
              name: true,
              description: true,
              schema: true,
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

      const validatedData = await validateSurveyData(
        currentProcessRun.information,
        { ...informationData },
        { strict: true }
      );

      if (!validatedData.valid) {
        throw new Error(
          validatedData.errors
            .map((e: { message: string }) => e.message)
            .join(", ")
        );
      }

      const allProcessData = Object.assign(
        {},
        ...currentProcessRun.workflowRun.processes
          .filter((p) => p.data && typeof p.data === "object")
          .map((p) => p.data)
      );

      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            email: ctx.session.user.email,
            name: ctx.session.user.name,
            role: ctx.session.user.role,
            id: ctx.session.user.id,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          data: allProcessData,
          process: {
            responsibleTeam:
              currentProcessRun.workflowRun.workflow.responsibleTeam?.name,
            teams:
              currentProcessRun.workflowRun.workflow.teams?.map(
                (t) => t.name
              ) ?? [],
          },
        };

        const rules = JSON.parse(
          currentProcessRun.process.submitProcessPermissions || "{}"
        );
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error(
            "Keine Berechtigung zum Abschließen dieses Prozesses"
          );
        }
      }

      if (
        currentProcessRun.workflowRun.isArchived ||
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
          informationData,
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

      /* // Get all process run data for the workflow run
      const { allProcessRuns: allProcessRunsData, allProcessDataOnly } =
        await getAllProcessRunData(workflowRunId);

      const submissionContext = {
        user: {
          ...ctx.session.user,
        },
        data: {
          currentProcessData: processRun.data,
          allProcessData: allProcessRunsData,
          allProcessDataOnly: allProcessDataOnly,
        },
        workflow: {
          name: currentProcessRun.workflowRun.workflow.name,
          description: currentProcessRun.workflowRun.workflow.description,
          responsibleTeam:
            currentProcessRun.workflowRun.workflow.responsibleTeam?.name,
          teams: currentProcessRun.workflowRun.workflow.teams ?? [],
        },
        workflowRun: {
          id: workflowRunId,
        },
        activeProcess: processRun.process,
      };

      await triggerN8nWebhooks(
        processRun.process.saveN8nWorkflows.map((w) => w.workflowId),
        submissionContext
      ); */
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath(`/runs/${workflowRunId}`);
    return {
      message: "Informationen/Aufgaben aktualisiert",
    };
  });
