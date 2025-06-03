"use server";

import { authActionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import {
  assignTeamsSchema,
  removeTeamSchema,
  updateWorkflowSchema,
  workflowSchema,
} from "./_schemas";
import prisma from "@/lib/prisma";
import { formatError } from "@/utils/format-error";
import { authQuery } from "@/server/utils/auth-query";
import { idSchema } from "@/schemas/id-schema";
import jsonLogic from "json-logic-js";

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
    const { name, description, isPublic, isActive, responsibleTeam } =
      parsedInput;

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
          editWorkflowPermissions: "(1 = 1)",
          submitProcessPermissions: "(1 = 1)",
          ...(responsibleTeam.id && {
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
    } = parsedInput;

    try {
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

      if (
        ctx.session.user.role !== "moderator" &&
        ctx.session.user.role !== "admin"
      ) {
        throw new Error("Keine Berechtigung zum bearbeiten dieses Workflows");
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

      // Skip permission check for admins
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

          form: {
            responsibleTeam: workflow.responsibleTeam?.name,
            teams: workflow.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(workflow.editWorkflowPermissions || "{}");
        const hasPermission = jsonLogic.apply(rules, context);

        if (!hasPermission) {
          throw new Error("Keine Berechtigung zum löschen dieses Workflows");
        }
      }

      // Only allow moderators and admins to delete
      if (
        ctx.session.user.role !== "moderator" &&
        ctx.session.user.role !== "admin"
      ) {
        throw new Error("Keine Berechtigung zum löschen dieses Workflows");
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

/* export const fillOutForm = authActionClient
  .schema(idSchema)
  .metadata({
    event: "fillOutFormAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    let formSubmissionId: string;

    try {
      const submission = await prisma.$transaction(async (tx) => {
        const form = await tx.form.findUnique({
          where: { id: parsedInput.id },
          select: {
            isActive: true,
            submissions: {
              where: {
                isExample: true,
              },
            },
          },
        });

        const exampleSubmissionExists = form?.submissions.length > 0;

        if (!form?.isActive) {
          throw new Error("Formular ist nicht aktiviert");
        }

        return await tx.formSubmission.create({
          data: {
            formId: parsedInput.id,
            submittedById: ctx.session.user.id,
            isExample: exampleSubmissionExists ? false : true,
          },
        });
      });

      formSubmissionId = submission.id;
    } catch (error) {
      throw formatError(error);
    }

    redirect(`/form-submissions/${formSubmissionId}`);
  }); */

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
    const { id, teamId } = parsedInput;
    try {
      const workflow = await prisma.workflow.findUnique({
        where: { id },
        select: { editWorkflowPermissions: true },
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
            disconnect: {
              id: teamId,
            },
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
