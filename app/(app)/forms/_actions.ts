"use server";

import { authActionClient } from "@/server/utils/action-clients";
import { revalidatePath } from "next/cache";
import {
  assignTeamsSchema,
  formSchema,
  removeTeamSchema,
  updateFormSchema,
} from "./_schemas";
import prisma from "@/lib/prisma";
import { formatError } from "@/utils/format-error";
import { authQuery } from "@/server/utils/auth-query";
import { idSchema } from "@/schemas/id-schema";
import { redirect } from "next/navigation";
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
export const createForm = authActionClient
  .schema(formSchema)
  .metadata({
    event: "createFormAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { title, description, icon, isPublic, isActive, responsibleTeam } =
      parsedInput;

    try {
      if (
        ctx.session.user.role !== "admin" &&
        ctx.session.user.role !== "moderator"
      ) {
        throw new Error("Keine Berechtigung zum Erstellen von Formularen");
      }
      await prisma.form.create({
        data: {
          title,
          description,
          icon,
          isPublic,
          isActive,
          editFormPermissions: "(1 = 1)",
          reviewFormPermissions: "(1 = 1)",
          responsibleTeamId: responsibleTeam?.id,
          createdById: ctx.session.user.id,
        },
      });
    } catch (error) {
      throw formatError(error);
    }

    revalidatePath("/forms");
    return {
      message: "Formular erstellt",
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
export const updateForm = authActionClient
  .schema(updateFormSchema)
  .metadata({
    event: "updateFormAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const {
      id,
      title,
      description,
      icon,
      isPublic,
      isActive,
      editFormPermissions,
      reviewFormPermissions,
      responsibleTeam,
    } = parsedInput;

    try {
      const form = await prisma.form.findUnique({
        where: { id },
        select: {
          editFormPermissions: true,
          teams: true,
          responsibleTeam: true,
        },
      });

      if (!form) {
        throw new Error("Formular nicht gefunden");
      }

      if (ctx.session.user.role !== "admin") {
        const context = {
          user: {
            ...ctx.session.user,
            teams: ctx.session.user.teams?.map((t) => t.name) ?? [],
          },
          form: {
            responsibleTeam: form.responsibleTeam?.name,
            teams: form.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(form.editFormPermissions || "{}");

        const hasPermission = jsonLogic.apply(rules, context);

        if (!hasPermission) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Formulars");
        }
      }

      if (
        ctx.session.user.role !== "moderator" &&
        ctx.session.user.role !== "admin"
      ) {
        throw new Error("Keine Berechtigung zum bearbeiten dieses Formulars");
      }

      await prisma.form.update({
        where: { id },
        data: {
          title,
          description,
          icon,
          isPublic,
          isActive,
          editFormPermissions,
          reviewFormPermissions,
          responsibleTeamId: responsibleTeam?.id,
        },
      });
    } catch (error) {
      console.log(error);
      throw formatError(error);
    }

    revalidatePath("/forms");
    return {
      message: "Formular aktualisiert",
    };
  });

/**
 * Deletes a user from the database
 * @param {Object} options.parsedInput - The validated input data
 * @param {string} options.parsedInput.id - The ID of the form to delete
 * @returns {Promise<void>}
 * @throws {Error} If the delete operation fails
 */
export const deleteForm = authActionClient
  .schema(idSchema)
  .metadata({
    event: "deleteFormAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;
    try {
      const form = await prisma.form.findUnique({
        where: { id },
        select: {
          editFormPermissions: true,
          teams: true,
          responsibleTeam: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!form) {
        throw new Error("Formular nicht gefunden");
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
            responsibleTeam: form.responsibleTeam?.name,
            teams: form.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(form.editFormPermissions || "{}");
        const hasPermission = jsonLogic.apply(rules, context);

        if (!hasPermission) {
          throw new Error("Keine Berechtigung zum löschen dieses Formulars");
        }
      }

      // Only allow moderators and admins to delete
      if (
        ctx.session.user.role !== "moderator" &&
        ctx.session.user.role !== "admin"
      ) {
        throw new Error("Keine Berechtigung zum löschen dieses Formulars");
      }

      await prisma.form.delete({
        where: { id },
      });
    } catch (error) {
      throw formatError(error);
    }
    revalidatePath("/forms");
    return {
      message: "Formular gelöscht",
    };
  });

export const fillOutForm = authActionClient
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
  });

export type UserSearchParams = {
  name: string;
};

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
export const getForms = async () => {
  const { user } = await authQuery();

  if (user.role === "admin") {
    return prisma.form.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        schema: true,
        isActive: true,
        isPublic: true,
        editFormPermissions: true,
        reviewFormPermissions: true,
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
        submissions: {
          select: {
            data: true,
          },
          where: { isExample: true },
          take: 1,
        },
      },
    });
  }

  const forms = await prisma.form.findMany({
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
      title: true,
      description: true,
      icon: true,
      schema: true,
      isActive: true,
      isPublic: true,
      editFormPermissions: true,
      reviewFormPermissions: true,
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
      submissions: {
        select: {
          data: true,
        },
        where: { isExample: true },
        take: 1,
      },
    },
  });

  return forms;
};

export type FormProps = Awaited<ReturnType<typeof getForms>>;

export const removeTeam = authActionClient
  .schema(removeTeamSchema)
  .metadata({
    event: "removeTeamAction",
  })
  .stateAction(async ({ parsedInput, ctx }) => {
    const { id, teamId } = parsedInput;
    try {
      const form = await prisma.form.findUnique({
        where: { id },
        select: { editFormPermissions: true },
      });

      if (!form) {
        throw new Error("Formular nicht gefunden");
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

        const rules = JSON.parse(form.editFormPermissions || "{}");
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Formulars");
        }
      }
      await prisma.form.update({
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

    revalidatePath("/forms");

    return {
      message: "Team entfernt",
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
      const form = await prisma.form.findUnique({
        where: { id },
        select: {
          editFormPermissions: true,
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

      if (!form) {
        throw new Error("Formular nicht gefunden");
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
          form: {
            responsibleTeam: form.responsibleTeam?.name,
            teams: form.teams?.map((t) => t.name) ?? [],
          },
        };

        const rules = JSON.parse(form.editFormPermissions || "{}");
        const hasPermission = jsonLogic.apply(rules, context);

        if (hasPermission !== true) {
          throw new Error("Keine Berechtigung zum Bearbeiten dieses Formulars");
        }
      }
      await prisma.form.update({
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

    revalidatePath("/forms");

    return {
      message: "Teams hinzugefügt",
    };
  });

export type AvailableTeamsParams = {
  formId: string;
};

export const getAvailableTeams = async ({ formId }: AvailableTeamsParams) => {
  await authQuery();
  const teams = await prisma.team.findMany({
    where: {
      forms: {
        none: {
          id: formId,
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
